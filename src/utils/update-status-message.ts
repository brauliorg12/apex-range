import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { readState } from './state-manager';
import { getPlayerStats } from './player-stats';
import { createRankButtons, createManagementButtons } from './button-helper';

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
    await roleSelectionMessage.edit({ components: updatedButtons });

    // Actualizar embed de estadísticas
    const embed = new EmbedBuilder()
      .setColor('#bdc3c7') // Color gris claro
      .setTitle('Estadísticas de Jugadores');

    embed.setFields(
      {
        name: 'Registrados',
        value: `👥 - **${stats.total}**`,
        inline: true,
      },
      {
        name: 'En Línea',
        value: `🟢 - **${stats.online}**`,
        inline: true,
      }
    );

    const managementButtons = createManagementButtons();
    await statsMessage.edit({
      content: '',
      embeds: [embed],
      components: [managementButtons],
    });
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}