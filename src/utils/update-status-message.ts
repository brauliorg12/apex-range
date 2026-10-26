import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { readRolesState, writeRolesState } from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons } from './button-helper';
import { buildRecentAvatarsCard } from './recent-avatars-card';
import {
  ALL_PLAYERS_EMOGI,
  MAX_ATTACHMENTS_PER_MESSAGE,
  STATS_LOGO_EMOGI,
} from '../models/constants';
import { updateRankCardMessage } from '../helpers/update-rank-card-message';
import { notifySetupRolesError } from './error-notifier';
import { getServerLogger } from './server-logger';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { runHeavyTask } from './heavy-task-queue';

// Map para encadenar actualizaciones secuenciales por guild
const updateLocks = new Map<string, Promise<void>>();

/**
 * Obtiene un canal de texto específico de un servidor de Discord.
 * @param guild El objeto Guild de Discord.js que representa el servidor.
 * @param channelId El ID del canal a buscar.
 * @returns Una promesa que resuelve a un TextChannel.
 */
export async function fetchChannel(guild: Guild, channelId: string) {
  return (await guild.channels.fetch(channelId)) as TextChannel;
}

/**
 * Actualiza los mensajes de selección de roles, estadísticas de jugadores y
 * cards de rangos en el canal configurado.
 *
 * Las actualizaciones del mismo guild se serializan. El trabajo pesado se
 * encola globalmente para evitar picos de CPU entre guilds e interacciones.
 *
 * @param guild - El guild cuyos mensajes se actualizan.
 * @returns Una promesa que se resuelve cuando la actualización termina.
 * @throws {Error} Si falla la actualización del guild.
 */
export async function updateRoleCountMessage(guild: Guild) {
  const guildId = guild.id;
  const previous = updateLocks.get(guildId) ?? Promise.resolve();
  let release!: () => void;
  const lock = new Promise<void>((resolve) => {
    release = resolve;
  });

  updateLocks.set(guildId, lock);
  await previous.catch(() => {});

  try {
    await runHeavyTask(() => performUpdate(guild));
  } finally {
    release();
    if (updateLocks.get(guildId) === lock) {
      updateLocks.delete(guildId);
    }
  }
}

async function performUpdate(guild: Guild) {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);
  serverLogger.info('Ejecutando actualización de mensajes de roles');
  try {
    serverLogger.debug('Leyendo estado de roles...');
    const rolesState = await readRolesState(guild.id);
    if (
      !rolesState?.channelId ||
      !rolesState.roleCountMessageId ||
      !rolesState.roleSelectionMessageId
    ) {
      serverLogger.warn('Estado de roles incompleto:', {
        hasChannelId: !!rolesState?.channelId,
        hasRoleCountMessageId: !!rolesState?.roleCountMessageId,
        hasRoleSelectionMessageId: !!rolesState?.roleSelectionMessageId,
      });
      return;
    }

    serverLogger.debug('Obteniendo canal...');
    let channel: TextChannel;
    try {
      channel = await fetchChannel(guild, rolesState.channelId);
    } catch (error: any) {
      if (error.code === 10003) {
        serverLogger.warn(
          'El canal configurado ya no existe. Limpiando estado de roles para forzar re-setup.'
        );
        // Limpiar el estado de roles ya que el canal no existe
        await writeRolesState({
          guildId: guild.id,
          channelId: undefined,
          roleCountMessageId: undefined,
          roleSelectionMessageId: undefined,
          rankCardMessageIds: undefined,
        });
        return;
      } else {
        serverLogger.error('Error al obtener el canal:', error);
        return;
      }
    }

    serverLogger.debug('Obteniendo estadísticas de jugadores...');
    const stats = await getPlayerStats(guild);
    serverLogger.debug('Estadísticas obtenidas:', stats);

    let roleSelectionFound = true;
    let statsMessageFound = true;

    // Actualizar mensaje de selección de roles
    serverLogger.debug('Actualizando mensaje de selección de roles...');
    try {
      const roleSelectionMessage = await channel.messages.fetch(
        rolesState.roleSelectionMessageId
      );
      const updatedButtons = createRankButtons(guild.client, guild);
      await roleSelectionMessage.edit({ components: updatedButtons });
    } catch (error: any) {
      if (error.code === 10008) {
        serverLogger.warn(
          'El mensaje de selección de roles no fue encontrado. Ejecuta el comando de setup para restaurar el panel.'
        );
        roleSelectionFound = false;
      }
    }

    // Actualizar mensaje de estadísticas
    serverLogger.debug('Actualizando mensaje de estadísticas...');
    try {
      const statsMessage = await channel.messages.fetch(
        rolesState.roleCountMessageId
      );

      const fields = [
        { name: 'En Línea', value: `🟢 - **${stats.online}**`, inline: true },
        {
          name: 'Registrados',
          value: `${ALL_PLAYERS_EMOGI} - **${stats.total}**`,
          inline: true,
        },
      ];

      const embed = new EmbedBuilder()
        .setColor('#bdc3c7')
        .setTitle(`${STATS_LOGO_EMOGI} Estadísticas de Jugadores`)
        .setFields(fields);

      serverLogger.debug('Construyendo card de avatares recientes...');
      const recentCard = await buildRecentAvatarsCard(guild);

      // Solo el resumen y el card de avatares, NO el header ni los cards por rango
      const embedsToSend = [
        embed,
        ...(recentCard ? [recentCard.embed] : []),
      ].filter(Boolean);
      const filesToSend = [...(recentCard ? recentCard.files : [])].slice(
        0,
        MAX_ATTACHMENTS_PER_MESSAGE
      );

      await statsMessage.edit({
        content: '',
        embeds: embedsToSend,
        components: [],
        files: filesToSend,
      });
    } catch (error: any) {
      if (error.code === 10008) {
        serverLogger.warn(
          'El mensaje de estadísticas no fue encontrado. Ejecuta el comando de setup para restaurar el panel.'
        );
        statsMessageFound = false;
      }
    }

    // Notificar según qué mensajes faltan
    if (!roleSelectionFound && !statsMessageFound) {
      await notifySetupRolesError(guild, channel, 'both_deleted');
    } else if (!roleSelectionFound) {
      await notifySetupRolesError(guild, channel, 'role_selection_deleted');
    } else if (!statsMessageFound) {
      await notifySetupRolesError(guild, channel, 'stats_message_deleted');
    }

    // --- Actualizar los cards por rango ---
    serverLogger.debug('Actualizando cards de rangos...');
    if (rolesState && rolesState.channelId) {
      // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
      const ranks = getApexRanksForGuild(guild.id, guild);
      for (const rank of ranks) {
        const msgId = rolesState.rankCardMessageIds?.[rank.shortId];
        if (msgId) {
          try {
            await updateRankCardMessage(guild, channel, rank.shortId, msgId);
          } catch (err: any) {
            if (err.code === 10008) {
              serverLogger.warn(
                `[updateRoleCountMessage] El mensaje del card de rango ${rank.shortId} no existe. Ejecuta el comando de setup para restaurar el panel.`
              );
            } else {
              serverLogger.error(
                `[updateRoleCountMessage] Error inesperado al actualizar el card de rango:`,
                err
              );
            }
          }
        }
      }
    }
    // --- FIN cards por rango ---
    const executionTime = Math.round(performance.now() - startTime);
    serverLogger.info(
      'Actualización de mensajes de roles completada',
      executionTime
    );
  } catch (error) {
    serverLogger.error(
      'Error al actualizar el mensaje de conteo de roles:',
      error
    );
    throw error; // Re-throw para que el caller lo maneje si es necesario
  }
}
