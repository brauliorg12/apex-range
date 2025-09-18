import { Client, Guild, Events } from 'discord.js';
import {
  readRolesState,
  readApexStatusState,
  writePlayers,
} from '../utils/state-manager';
import {
  updateApexInfoMessage,
  updateRoleCountMessage,
} from '../utils/update-status-message';
import { updateBotPresence } from '../utils/presence-helper';
import { logApp } from '../utils/logger';
import { getPlayerData } from '../utils/player-data-manager';
import { getAllRankedPlayers } from '../interactions/player-list';
import { registerGuildPeriodicTasks } from '../utils/global-scheduler';
import { enqueueGuildUpdate } from '../utils/guild-update-queue';

/**
 * Configura el evento para cuando el bot se une a un nuevo servidor.
 * Detecta si el servidor ya estaba configurado y restaura la funcionalidad,
 * o envía un mensaje de bienvenida para nuevos servidores.
 *
 * @param client - El cliente de Discord.
 */
export function setupNewGuildHandler(client: Client): void {
  client.on(Events.GuildCreate, async (guild) => {
    await handleNewGuild(client, guild);
  });
}

/**
 * Maneja la lógica cuando el bot se une a un nuevo servidor.
 * Verifica configuración previa y configura actualizaciones si es necesario.
 *
 * @param client - El cliente de Discord.
 * @param guild - El nuevo guild al que se unió el bot.
 */
async function handleNewGuild(client: Client, guild: Guild): Promise<void> {
  logApp(`Bot añadido a nuevo servidor: ${guild.name} (${guild.id})`);

  try {
    // Verificar si el servidor ya tiene configuración previa
    const rolesState = await readRolesState(guild.id);
    if (rolesState?.guildId) {
      await handleExistingConfiguredGuild(client, guild);
    } else {
      await handleNewUnconfiguredGuild(guild);
    }
  } catch (error) {
    logApp(
      `Error procesando nuevo servidor ${guild.name} (${guild.id}): ${error}`
    );
  }
}

/**
 * Maneja un servidor que ya estaba configurado previamente.
 * Restaura todas las funcionalidades y actualizaciones.
 *
 * @param client - El cliente de Discord.
 * @param guild - El guild configurado previamente.
 */
async function handleExistingConfiguredGuild(
  client: Client,
  guild: Guild
): Promise<void> {
  logApp(
    `Servidor ya configurado detectado: ${guild.name} (${guild.id}). Inicializando actualizaciones.`
  );

  // Ejecutar actualización inicial inmediata
  await enqueueGuildUpdate(
    guild,
    async () => {
      await synchronizePlayersWithRoles(guild);
      await updateRoleCountMessage(guild);
      await updateBotPresence(client);
      logApp(
        `Actualización inicial de roles y presencia ejecutada en guild ${guild.name} (${guild.id})`
      );
    },
    1
  );

  // Actualizar mensaje de /apex-status si existe
  const apexStatusState = await readApexStatusState(guild.id);
  if (apexStatusState?.apexInfoMessageId && apexStatusState.channelId) {
    await updateApexInfoMessage(guild);
  }

  // Registrar tareas periódicas en el scheduler global
  registerGuildPeriodicTasks(guild, client);

  // Enviar mensaje de confirmación
  await sendReconnectionMessage(guild);
}

/**
 * Maneja un servidor nuevo sin configuración previa.
 * Envía un mensaje de bienvenida con instrucciones.
 *
 * @param guild - El nuevo guild sin configurar.
 */
async function handleNewUnconfiguredGuild(guild: Guild): Promise<void> {
  const channel =
    guild.systemChannel || guild.channels.cache.find((ch) => ch.type === 0);
  if (channel && 'send' in channel) {
    await channel.send({
      content: `¡Hola! Soy Apex Range Bot. Para configurar el panel de rangos, un administrador debe ejecutar el comando \`/setup-roles\` en este canal. ¡Gracias por añadirme!`,
    });
  }
}

/**
 * Sincroniza el JSON de jugadores con los roles actuales del servidor.
 * Función auxiliar para mantener consistencia con guild-initializer.
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
 * Envía un mensaje de confirmación cuando el bot se reconecta a un servidor configurado.
 *
 * @param guild - El guild al que se reconectó.
 */
async function sendReconnectionMessage(guild: Guild): Promise<void> {
  const channel =
    guild.systemChannel || guild.channels.cache.find((ch) => ch.type === 0);
  if (channel && 'send' in channel) {
    await channel.send({
      content: `✅ **¡Bot reconectado exitosamente!**\n\nEl panel de rangos ya estaba configurado. Todas las funciones están activas y la presencia global se ha actualizado.`,
    });
  }
}
