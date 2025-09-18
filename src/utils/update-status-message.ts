import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import {
  readApexStatusState,
  readRolesState,
  writeApexStatusState,
} from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons } from './button-helper';
import { buildRecentAvatarsCard } from './recent-avatars-card';
import { APEX_RANKS, MAX_ATTACHMENTS_PER_MESSAGE } from '../models/constants';
import { updateRankCardMessage } from '../helpers/update-rank-card-message';
import { createApexStatusEmbeds } from './apex-status-embed';
import { notifyApexUpdateError } from './error-notifier';
import { getServerLogger } from './server-logger';

async function fetchChannel(guild: Guild, channelId: string) {
  return (await guild.channels.fetch(channelId)) as TextChannel;
}

export async function updateRoleCountMessage(guild: Guild) {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);
  serverLogger.info('Ejecutando actualización de mensajes de roles');
  try {
    const rolesState = await readRolesState(guild.id);
    if (
      !rolesState?.channelId ||
      !rolesState.roleCountMessageId ||
      !rolesState.roleSelectionMessageId
    ) {
      return;
    }

    const channel = await fetchChannel(guild, rolesState.channelId);
    if (!channel) return;

    const stats = await getPlayerStats(guild);

    // Actualizar mensaje de selección de roles
    try {
      const roleSelectionMessage = await channel.messages.fetch(
        rolesState.roleSelectionMessageId
      );
      const updatedButtons = createRankButtons(guild.client);
      await roleSelectionMessage.edit({ components: updatedButtons });
    } catch (error: any) {
      if (error.code === 10008) {
        serverLogger.warn(
          'El mensaje de selección de roles no fue encontrado. Ejecuta el comando de setup para restaurar el panel.'
        );
      }
    }

    // Actualizar mensaje de estadísticas
    try {
      const statsMessage = await channel.messages.fetch(
        rolesState.roleCountMessageId
      );

      const fields = [
        { name: 'En Línea', value: `🟢 - **${stats.online}**`, inline: true },
        { name: 'Registrados', value: `👥 - **${stats.total}**`, inline: true },
      ];

      const embed = new EmbedBuilder()
        .setColor('#bdc3c7')
        .setTitle('Estadísticas de Jugadores')
        .setFields(fields);

      const recentCard = await buildRecentAvatarsCard(guild);

      // Solo el resumen y el card de avatares, NO el header ni los cards por rango
      const embedsToSend = [embed, ...(recentCard ? [recentCard.embed] : [])];
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
      }
    }

    // --- Actualizar los cards por rango ---
    if (rolesState && rolesState.channelId) {
      for (const rank of APEX_RANKS) {
        const msgId = rolesState.rankCardMessageIds?.[rank.shortId];
        if (msgId) {
          try {
            // Debes tener una función updateRankCardMessage(guild, channel, rankId, msgId)
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
  }
}

export async function updateApexInfoMessage(guild: Guild) {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);

  serverLogger.info('Iniciando actualización del mensaje de Apex');
  try {
    const apexStatusState = await readApexStatusState(guild.id);
    serverLogger.debug('Estado de Apex leído', apexStatusState);
    if (!apexStatusState?.channelId || !apexStatusState.apexInfoMessageId) {
      serverLogger.info(
        'No hay estado válido para actualizar Apex en este servidor'
      );
      return;
    }

    const channel = await fetchChannel(guild, apexStatusState.channelId);
    if (!channel) {
      serverLogger.warn(`Canal no encontrado: ${apexStatusState.channelId}`);
      return;
    }

    const embeds = await createApexStatusEmbeds(
      apexStatusState.guildId,
      apexStatusState.channelId
    );
    serverLogger.debug(`Embeds de Apex creados: ${embeds.length}`);

    try {
      await channel.messages.edit(apexStatusState.apexInfoMessageId, {
        embeds,
      });
      serverLogger.info('Mensaje de Apex editado exitosamente');
    } catch (error: any) {
      serverLogger.error('Error editando mensaje de Apex', error.message);
      if (error.code === 10008) {
        serverLogger.warn('Mensaje de Apex no encontrado, limpiando estado');
        const currentState = await readApexStatusState(guild.id);
        if (currentState) {
          await writeApexStatusState({
            ...currentState,
            apexInfoMessageId: undefined,
            guildId: guild.id,
          });
        }
        await notifyApexUpdateError(guild, channel, 'message_not_found');
      } else if (error.code === 50013) {
        // Missing Permissions
        serverLogger.warn('Falta de permisos para editar el mensaje de Apex');
        await notifyApexUpdateError(guild, channel, 'missing_permissions');
      } else {
        serverLogger.error('Error desconocido al actualizar Apex', error);
        await notifyApexUpdateError(guild, channel, 'unknown', error.message);
      }
    }
  } catch (error) {
    serverLogger.error('Error general al actualizar el mensaje de Apex', error);
  }
  const executionTime = Math.round(performance.now() - startTime);
  serverLogger.info(
    'Actualización del mensaje de Apex completada',
    executionTime
  );
}
