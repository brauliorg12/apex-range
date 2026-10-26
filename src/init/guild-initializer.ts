import { Client, Guild } from 'discord.js';
import { readRolesStateStrict } from '../utils/state-manager';
import { notifyCorruptStateAlert } from '../utils/admin-alert';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { updateBotPresence } from '../utils/presence-helper';
import { getGlobalApiStatus } from '../utils/global-api-status';
import { checkApiHealth } from '../utils/api-health-check';
import { createUpdateThrottler } from '../utils/update-throttler';
import { logApp } from '../utils/logger';
import { printBanner } from '../helpers/print-banner';
import { cleanupOldServerFiles } from '../helpers/cleanup-old-server-files';
import {
  initializeGlobalScheduler,
  registerGuildPeriodicTasks,
} from '../utils/global-scheduler';
import { enqueueGuildUpdate } from '../utils/guild-update-queue';
import { synchronizePlayersWithRoles } from '../utils/synchronize-players';
import { enqueueRankSync } from '../services/rank-sync/rank-sync';

/**
 * Inicializa un guild existente con configuración previa.
 * Configura actualizaciones periódicas, sincronización de datos y mensajes.
 *
 * Si `.bot-state` no existe, el guild se omite sin alerta. Si está corrupto o
 * es ilegible, alerta al administrador de la app y no continúa como si no
 * hubiera configuración.
 *
 * @param client - El cliente de Discord.
 * @param guild - El guild a inicializar.
 */
export async function initializeExistingGuild(
  client: Client,
  guild: Guild
): Promise<void> {
  const stateResult = await readRolesStateStrict(guild.id);
  if (stateResult.status === 'missing') return;

  if (stateResult.status !== 'ok') {
    await notifyCorruptStateAlert({
      guildId: guild.id,
      guildName: guild.name,
      errorType: stateResult.status,
    });
    return;
  }

  const rolesState = stateResult.state;
  if (!rolesState.guildId) return;

  // Obtener información del canal
  let channelInfo = '';
  if (rolesState.channelId) {
    try {
      const channel = await guild.channels.fetch(rolesState.channelId);
      if (channel && 'name' in channel) {
        channelInfo = `Canal: #${channel.name} (${channel.id})`;
      } else {
        channelInfo = `Canal: (no encontrado, id=${rolesState.channelId})`;
      }
    } catch {
      channelInfo = `Canal: (no encontrado, id=${rolesState.channelId})`;
    }
  } else {
    channelInfo = 'Canal: (no configurado)';
  }

  printBanner(client, guild, channelInfo);
  logApp(
    `Inicializando ciclo de actualización para guild ${guild.name} (${guild.id})`
  );

  // Configurar throttler para actualizaciones coalescidas
  const throttler = createUpdateThrottler(60_000, async (guild: Guild) => {
    enqueueGuildUpdate(
      guild,
      async () => {
        await synchronizePlayersAndEnqueueRankSync(guild, 'startup');
        await updateRoleCountMessage(guild);
        await updateBotPresence(client);
        logApp(
          `Actualización de roles y presencia ejecutada en guild ${guild.name} (${guild.id})`
        );
      },
      'startup-refresh',
      1
    ); // Prioridad normal
  });

  throttler.requestUpdate(guild);

  // Registrar tareas periódicas en el scheduler global
  registerGuildPeriodicTasks(guild, client);

  // Verificar estado de API al inicio
  await checkApiHealth();
  logApiStatus();
}

/**
 * Sincroniza los jugadores del guild y encola el rank sync cuando esa
 * sincronización terminó.
 *
 * El rank sync se encola siempre después de que la sincronización de
 * jugadores se resuelva, tanto en éxito como en fallo. Si falla, se encola
 * con el error para que omita la reconstrucción del panel y notifique el
 * problema en lugar de interpretar el fallo como un guild sin jugadores.
 *
 * No se espera al rank sync: el arranque no queda bloqueado y el rank sync
 * nunca espera a la sincronización de jugadores, por lo que no hay riesgo de
 * deadlock.
 *
 * @param guild - Guild cuya sincronización de jugadores se ejecuta.
 * @param reason - Motivo que se reporta en el rank sync.
 * @returns Una promesa que se resuelve cuando la sincronización de jugadores
 *   terminó y el rank sync quedó encolado.
 * @throws {Error} El error original de `synchronizePlayersWithRoles` si la
 *   sincronización de jugadores falla.
 */
export async function synchronizePlayersAndEnqueueRankSync(
  guild: Guild,
  reason: string
): Promise<void> {
  try {
    await synchronizePlayersWithRoles(guild);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logApp(
      `[guild-sync] Sincronización de jugadores falló en guild ${guild.name} ` +
        `(${guild.id}): ${message}`
    );
    enqueueRankSync(guild, { reason, playerSyncError: message });
    throw error;
  }

  enqueueRankSync(guild, { reason });
}

/**
 * Registra el estado actual de la API en los logs.
 */
function logApiStatus(): void {
  const apiStatus = getGlobalApiStatus();
  const color = apiStatus.ok ? '🟢' : '🔴';
  const lastChecked = apiStatus.lastChecked
    ? apiStatus.lastChecked.toLocaleString()
    : 'Nunca';

  logApp(
    `Estado API: ${
      apiStatus.ok ? 'Conectado' : 'Desconectado'
    } | Última vez chequeado: ${lastChecked}`
  );

  console.log('------------------------------------------');
  console.log('  SERVIDOR/API Apex Range ');
  console.log(
    `  Estado: ${color} ${apiStatus.ok ? 'Conectado' : 'Desconectado'}`
  );
  console.log(`  Última vez chequeado: ${lastChecked}`);
  console.log('------------------------------------------');

  logApp('------------------------------------------');
  logApp('  SERVIDOR/API Apex Range ');
  logApp(`  Estado: ${color} ${apiStatus.ok ? 'Conectado' : 'Desconectado'}`);
  logApp(`  Última vez chequeado: ${lastChecked}`);
  logApp('------------------------------------------');
}

/**
 * Inicializa todos los guilds existentes al iniciar el bot.
 * Limpia archivos antiguos opcionalmente y configura cada guild configurado.
 *
 * @param client - El cliente de Discord listo.
 */
export async function initializeExistingGuilds(client: Client): Promise<void> {
  // Inicializar scheduler global
  initializeGlobalScheduler(client);

  // Limpiar archivos antiguos (opcional, deshabilitado por defecto)
  await cleanupOldServerFiles(client);

  for (const [guildId] of client.guilds.cache) {
    try {
      const guild = await client.guilds.fetch(guildId);
      await initializeExistingGuild(client, guild);
    } catch (error) {
      logApp(`Error inicializando guild ${guildId}: ${error}`);
    }
  }
}
