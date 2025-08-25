import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { readState } from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons, createManagementButtons } from './button-helper';
import { buildAllOnlineEmbeds } from './online-embed-helper';
import { buildRecentAvatarsCard } from './recent-avatars-card';

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

    // Embeds de jugadores en línea por rango
    const { embeds: onlineEmbeds, files: onlineFiles } =
      await buildAllOnlineEmbeds(guild);

    // Cards
    const recentCard = await buildRecentAvatarsCard(guild);

    // Header
    const headerEmbed = new EmbedBuilder()
      .setColor('#ffffff')
      .setDescription(
        '🛡️ **Jugadores en línea por Rango**\n' +
          '> Puede clickear sobre los jugadores para interactuar'
      );

    // Orden: estadísticas -> (opcional) últimos 5 -> header rangos -> listado online
    const embedsToSend = [
      embed,
      ...(recentCard ? [recentCard.embed] : []),
      headerEmbed,
      ...onlineEmbeds,
    ];

    // Adjuntos combinados (solo “últimos 5” + online por rango)
    let filesToSend = [
      ...(recentCard ? recentCard.files : []),
      ...(onlineFiles ?? []),
    ];

    // Discord solo permite 10 archivos adjuntos por mensaje
    if (filesToSend.length > 10) {
      filesToSend = filesToSend.slice(0, 10);
    }

    try {
      await statsMessage.edit({
        content: '',
        embeds: embedsToSend,
        components: [createManagementButtons()],
        files: filesToSend,
      });
    } catch (error: any) {
      if (error.code === 10008) {
        const newMessage = await channel.send({
          content: '',
          embeds: embedsToSend,
          components: [createManagementButtons()],
          files: filesToSend,
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
