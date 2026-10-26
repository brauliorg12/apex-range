import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { getPlayerStats } from '../utils/player-stats';
import { createRankButtons } from '../utils/button-helper';
import { buildRecentAvatarsCard } from '../utils/recent-avatars-card';
import {
  ALL_PLAYERS_EMOGI,
  MAX_ATTACHMENTS_PER_MESSAGE,
  STATS_LOGO_EMOGI,
} from '../models/constants';
import { notifySetupRolesError } from '../utils/error-notifier';
import { isUnknownMessageError } from '../utils/message-reference';
import type { RolesState } from '../interfaces/bot-state';
import type { ServerLogger } from '../utils/server-logger';

/**
 * Actualiza el mensaje de selección, el resumen de estadísticas y el card de
 * avatares recientes.
 *
 * @param guild - Servidor de Discord.
 * @param rolesState - Estado de roles del guild.
 * @param channel - Canal configurado del panel.
 * @param serverLogger - Logger del guild.
 */
export async function updateRoleStatsMessages(
  guild: Guild,
  rolesState: RolesState,
  channel: TextChannel,
  serverLogger: ServerLogger
): Promise<void> {
  serverLogger.debug('Obteniendo estadísticas de jugadores...');
  const stats = await getPlayerStats(guild);
  serverLogger.debug('Estadísticas obtenidas:', stats);

  let roleSelectionFound = true;
  let statsMessageFound = true;

  serverLogger.debug('Actualizando mensaje de selección de roles...');
  try {
    const roleSelectionMessage = await channel.messages.fetch(
      rolesState.roleSelectionMessageId!
    );
    const updatedButtons = createRankButtons(guild.client, guild);
    await roleSelectionMessage.edit({ components: updatedButtons });
  } catch (error) {
    if (isUnknownMessageError(error)) {
      serverLogger.warn(
        'El mensaje de selección de roles no fue encontrado. Ejecuta el comando de setup para restaurar el panel.'
      );
      roleSelectionFound = false;
    }
  }

  serverLogger.debug('Actualizando mensaje de estadísticas...');
  try {
    const statsMessage = await channel.messages.fetch(
      rolesState.roleCountMessageId!
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
  } catch (error) {
    if (isUnknownMessageError(error)) {
      serverLogger.warn(
        'El mensaje de estadísticas no fue encontrado. Ejecuta el comando de setup para restaurar el panel.'
      );
      statsMessageFound = false;
    }
  }

  if (!roleSelectionFound && !statsMessageFound) {
    await notifySetupRolesError(guild, channel, 'both_deleted');
  } else if (!roleSelectionFound) {
    await notifySetupRolesError(guild, channel, 'role_selection_deleted');
  } else if (!statsMessageFound) {
    await notifySetupRolesError(guild, channel, 'stats_message_deleted');
  }
}
