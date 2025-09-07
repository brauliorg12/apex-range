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
import { updateRankCardMessage } from '../embeds/update-rank-card-message';
import { createApexStatusEmbeds } from './apex-status-embed';

async function fetchChannel(guild: Guild, channelId: string) {
  return (await guild.channels.fetch(channelId)) as TextChannel;
}

export async function updateRoleCountMessage(guild: Guild) {
  console.log(
    `[updateRoleCountMessage] Ejecutando para guild ${guild.name} (${guild.id})`
  );
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
        console.warn(
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
        console.warn(
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
              console.warn(
                `[updateRoleCountMessage] El mensaje del card de rango ${rank.shortId} no existe. Ejecuta el comando de setup para restaurar el panel.`
              );
            } else {
              console.error(
                `[updateRoleCountMessage] Error inesperado al actualizar el card de rango:`,
                err
              );
            }
          }
        }
      }
    }
    // --- FIN cards por rango ---
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}

export async function updateApexInfoMessage(guild: Guild) {
  try {
    const apexStatusState = await readApexStatusState(guild.id);
    if (!apexStatusState?.channelId || !apexStatusState.apexInfoMessageId) {
      return;
    }

    const channel = await fetchChannel(guild, apexStatusState.channelId);
    if (!channel) return;

    const embeds = await createApexStatusEmbeds(
      apexStatusState.guildId,
      apexStatusState.channelId
    );

    try {
      await channel.messages.edit(apexStatusState.apexInfoMessageId, {
        embeds,
      });
    } catch (error: any) {
      if (error.code === 10008) {
        console.warn(
          'El mensaje de información de Apex no fue encontrado, limpiando estado.'
        );
        const currentState = await readApexStatusState(guild.id);
        if (currentState) {
          await writeApexStatusState({
            ...currentState,
            apexInfoMessageId: undefined,
            guildId: guild.id,
          });
        }
      } else {
        console.error(
          'Error al actualizar el mensaje de información de Apex:',
          error
        );
      }
    }
  } catch (error) {
    console.error(
      'Error al actualizar el mensaje de información de Apex:',
      error
    );
  }
}
