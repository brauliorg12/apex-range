import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { readState } from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons, createManagementButtons } from './button-helper';
import { buildAllOnlineEmbeds } from './online-embed-helper';
import { buildRecentAvatarsCard } from './recent-avatars-card';
import { createApexStatusEmbed } from './apex-status-embed';

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

    const updatedButtons = createRankButtons(guild.client);
    try {
      await roleSelectionMessage.edit({ components: updatedButtons });
    } catch (error: any) {
      if (error.code === 10008) {
        const newMessage = await channel.send({ components: updatedButtons });
      } else {
        throw error;
      }
    }

    const fields = [
      {
        name: 'En Línea',
        value: `🟢 - **${stats.online}**`,
        inline: true,
      },
      {
        name: 'Registrados',
        value: `👥 - **${stats.total}**`,
        inline: true,
      },
    ];

    const embed = new EmbedBuilder()
      .setColor('#bdc3c7')
      .setTitle('Estadísticas de Jugadores')
      .setFields(fields);

    const { embeds: onlineEmbeds, files: onlineFiles } =
      await buildAllOnlineEmbeds(guild);

    const recentCard = await buildRecentAvatarsCard(guild);

    const headerEmbed = new EmbedBuilder()
      .setColor('#ffffff')
      .setDescription(
        '🛡️ **Jugadores en línea por Rango**\n' +
          '> Puede clickear sobre los jugadores para interactuar'
      );

    const embedsToSend = [
      embed,
      ...(recentCard ? [recentCard.embed] : []),
      headerEmbed,
      ...onlineEmbeds,
    ];

    let filesToSend = [
      ...(recentCard ? recentCard.files : []),
      ...(onlineFiles ?? []),
    ];

    if (filesToSend.length > 10) {
      filesToSend = filesToSend.slice(0, 10);
    }

    try {
      await statsMessage.edit({
        content: '',
        embeds: embedsToSend,
        components: [...createManagementButtons()],
        files: filesToSend,
      });
    } catch (error: any) {
      if (error.code === 10008) {
        const newMessage = await channel.send({
          content: '',
          embeds: embedsToSend,
          components: [...createManagementButtons()],
          files: filesToSend,
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}

export async function updateApexInfoMessage(guild: Guild) {
  try {
    const state = await readState();
    if (!state.channelId || !state.apexInfoMessageId) return;

    const channel = (await guild.channels.fetch(
      state.channelId
    )) as TextChannel;

    const apexInfoMessage = await channel.messages.fetch(
      state.apexInfoMessageId
    );

    if (!apexInfoMessage) return;

    // Usa el nuevo card consistente
    const embed = await createApexStatusEmbed();

    await apexInfoMessage.edit({ embeds: [embed] });
  } catch (error) {
    console.error(
      'Error al actualizar el mensaje de información de Apex:',
      error
    );
  }
}
