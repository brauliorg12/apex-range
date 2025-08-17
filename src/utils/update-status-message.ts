import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { readState } from './state-manager';
import { APEX_RANKS } from '../constants';
import { getOnlineMembersByRole } from './player-stats';
import { createRankButtons } from './button-helper';

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
    const statsMessage = await channel.messages.fetch(state.roleCountMessageId);
    const roleSelectionMessage = await channel.messages.fetch(
      state.roleSelectionMessageId
    );

    if (!channel || !statsMessage || !roleSelectionMessage) return;

    // Actualizar botones
    const updatedButtons = createRankButtons(guild.client, guild);
    await roleSelectionMessage.edit({ components: updatedButtons });

    // Actualizar embed de estadísticas
    const embed = new EmbedBuilder()
      .setColor('#bdc3c7') // Color gris claro
      .setTitle('Estadísticas de Jugadores');

    const rankRoles = APEX_RANKS.map((rank) =>
      guild.roles.cache.find((r) => r.name === rank.roleName)
    ).filter((r): r is NonNullable<typeof r> => r !== undefined);

    const uniqueMembers = new Set<string>();
    rankRoles.forEach((role) => {
      role.members.forEach((member) => uniqueMembers.add(member.id));
    });
    const totalPlayers = uniqueMembers.size;

    const onlineMembers = new Set<string>();
    rankRoles.forEach((role) => {
      getOnlineMembersByRole(role).forEach((member) =>
        onlineMembers.add(member.id)
      );
    });
    const totalOnline = onlineMembers.size;

    embed.setFields(
      {
        name: 'Registrados',
        value: `👥 - **${totalPlayers}**`,
        inline: true,
      },
      {
        name: 'En Línea',
        value: `🟢 - **${totalOnline}**`,
        inline: true,
      }
    );

    await statsMessage.edit({ content: '', embeds: [embed] });
  } catch (error) {
    console.error('Error al actualizar el mensaje de conteo de roles:', error);
  }
}
