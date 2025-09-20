import { Client, Guild } from 'discord.js';
import { readRolesState, writePlayers } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { updateBotPresence } from '../utils/presence-helper';
import { getGlobalApiStatus } from '../utils/global-api-status';
import { checkApiHealth } from '../utils/api-health-check';
import { createUpdateThrottler } from '../utils/update-throttler';
import { logApp } from '../utils/logger';
import { getPlayerData, getPlayerPlatform } from '../utils/player-data-manager';
import { getAllRankedPlayers } from '../interactions/player-list';
import { printBanner } from '../helpers/print-banner';
import { cleanupOldServerFiles } from '../helpers/cleanup-old-server-files';
import {
  initializeGlobalScheduler,
  registerGuildPeriodicTasks,
} from '../utils/global-scheduler';
import { enqueueGuildUpdate } from '../utils/guild-update-queue';

/**
 * Inicializa un guild existente con configuración previa.
 * Configura actualizaciones periódicas, sincronización de datos y mensajes.
 *
 * @param client - El cliente de Discord.
 * @param guild - El guild a inicializar.
 */
export async function initializeExistingGuild(
  client: Client,
  guild: Guild
): Promise<void> {
  const rolesState = await readRolesState(guild.id);
  if (!rolesState?.guildId) return;

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
        await synchronizePlayersWithRoles(guild);
        await updateRoleCountMessage(guild);
        await updateBotPresence(client);
        logApp(
          `Actualización de roles y presencia ejecutada en guild ${guild.name} (${guild.id})`
        );
      },
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
 * Sincroniza el JSON de jugadores con los roles actuales del servidor.
 * Agrega nuevos jugadores con roles y elimina aquellos que ya no los tienen.
 *
 * @param guild - El guild a sincronizar.
 */
async function synchronizePlayersWithRoles(guild: Guild): Promise<void> {
  const players = await getAllRankedPlayers(guild);
  const playerData = await getPlayerData(guild);

  const playerIdsWithRank = new Set(players.map((p) => p.member.id));
  let updated = false;

  // Agregar jugadores con rol que no están en el JSON
  for (const player of players) {
    if (!playerData.some((p) => p.userId === player.member.id)) {
      playerData.push({
        userId: player.member.id,
        assignedAt: new Date().toISOString(),
        rank: player.rankName,
        platform: (await getPlayerPlatform(guild.id, player.member.id)) || 'PC',
      });
      updated = true;
    }
  }

  // Eliminar del JSON los jugadores que ya no tienen rol de rango
  const originalLength = playerData.length;
  const filteredPlayerData = playerData.filter((p) =>
    playerIdsWithRank.has(p.userId)
  );
  if (filteredPlayerData.length !== originalLength) {
    updated = true;
  }

  if (updated) {
    await writePlayers(guild.id, filteredPlayerData);
    logApp(
      `Sincronización de jugadores con roles ejecutada en guild ${guild.name} (${guild.id})`
    );
  }
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
