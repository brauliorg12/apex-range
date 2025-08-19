import { Guild, TextChannel, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { readState } from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons, createManagementButtons } from './button-helper';
import { buildAllOnlineEmbeds } from './online-embed-helper';
import { getPlayerData } from './player-data-manager';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';

export async function updateRoleCountMessage(guild: Guild) {
  try {
    const state = await readState();
    if (
      !state.channelId ||
      !state.roleCountMessageId ||
      !state.roleSelectionMessageId
    )
      return;

    const channel = (await guild.channels.fetch(
      state.channelId
    )) as TextChannel;

    const [statsMessage, roleSelectionMessage, stats] = await Promise.all([
      channel.messages.fetch(state.roleCountMessageId),
      channel.messages.fetch(state.roleSelectionMessageId),
      getPlayerStats(guild),
    ]);

    if (!statsMessage || !roleSelectionMessage) return;

    // Actualizar botones
    const updatedButtons = createRankButtons(guild.client, guild);
    try {
      await roleSelectionMessage.edit({ components: updatedButtons });
    } catch (error: any) {
      if (error.code === 10008) {
        const newMessage = await channel.send({ components: updatedButtons });
        // Guarda newMessage.id donde corresponda
      } else {
        throw error;
      }
    }

    // Solo campos de jugadores
    const fields = [
      {
        name: 'Registrados',
        value: `👥 - **${stats.total}**`,
        inline: true,
      },
      {
        name: 'En Línea',
        value: `🟢 - **${stats.online}**`,
        inline: true,
      },
    ];

    const embed = new EmbedBuilder()
      .setColor('#bdc3c7')
      .setTitle('Estadísticas de Jugadores')
      .setFields(fields);

    // Embeds de jugadores en línea por rango
    const onlineEmbeds = await buildAllOnlineEmbeds(guild);

    // NUEVO: Mostrar "Últimos 5 registrados" solo si hay >= 5
    const playerData = await getPlayerData();
    const hasRecentCard = playerData.length >= 5;

    let recentEmbed: EmbedBuilder | undefined;
    if (hasRecentCard) {
      const recent = [...playerData]
        .sort(
          (a, b) =>
            new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
        )
        .slice(0, 5);

      const rankRoleNames = new Set(APEX_RANKS.map((r) => r.roleName));
      const recentLines = await Promise.all(
        recent.map(async (r, i) => {
          const member = guild.members.cache.get(r.userId);
          const ts = Math.floor(new Date(r.assignedAt).getTime() / 1000);

          if (!member) {
            return `${i + 1}. <@${r.userId}> — Sin datos — <t:${ts}:R>`;
          }

          const rankRole = member.roles.cache.find((role) =>
            rankRoleNames.has(role.name)
          );

          let rankLabel = 'Sin rango';
          let emoji = '';
          if (rankRole) {
            const rank = APEX_RANKS.find((rk) => rk.roleName === rankRole.name);
            if (rank) {
              emoji = getRankEmoji(guild.client, rank) || rank.icon;
              rankLabel = rank.label;
            }
          }

          return `${i + 1}. <@${
            member.id
          }> — ${emoji} ${rankLabel} — <t:${ts}:R>`;
        })
      );

      recentEmbed = new EmbedBuilder()
        .setColor('#2ecc71')
        .setTitle('🆕 Últimos 5 registrados')
        .setDescription(
          recentLines.length > 0 ? recentLines.join('\n') : '_Sin registros_'
        );
    }

    const headerImageUrl = process.env.RANKS_HEADER_IMAGE_URL;
    const headerEmbed = new EmbedBuilder()
      .setColor('#ffffff')
      .setDescription(
        '🛡️ **Jugadores por Rango**\n' +
          '> Puede clickear sobre los jugadores para interactuar'
      )
      .setImage(headerImageUrl || ''); // Emoji como imagen grande

    const managementButtons = createManagementButtons();

    // Filtro por rango (separado del card; aparece al final del mensaje)
    const rankFilterRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('RANK_FILTER')
          .setPlaceholder('Filtrar por rango')
          .addOptions(APEX_RANKS.map((r) => ({ label: r.label, value: r.shortId })))
      );

    // Orden: estadísticas -> (opcional) últimos 5 -> card -> listado online
    const embedsToSend = hasRecentCard
      ? [embed, recentEmbed!, headerEmbed, ...onlineEmbeds]
      : [embed, headerEmbed, ...onlineEmbeds];

    try {
      await statsMessage.edit({
        content: '',
        embeds: embedsToSend,
        components: [managementButtons, rankFilterRow], // componentes al final, lejos del card
      });
    } catch (error: any) {
      if (error.code === 10008) {
        const newMessage = await channel.send({
          content: '',
          embeds: embedsToSend,
          components: [managementButtons, rankFilterRow],
        });
        // Guarda newMessage.id donde corresponda
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}
