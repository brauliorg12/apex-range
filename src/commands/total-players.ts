import { SlashCommandBuilder } from 'discord.js';
import { APEX_RANKS } from '../constants';

export const data = new SlashCommandBuilder()
  .setName('total-jugadores')
  .setDescription(
    'Muestra el número total de jugadores con un rol de rango de Apex Legends.'
  );

export async function execute(interaction: {
  guild: { members: { fetch: () => any }; roles: { cache: any[] } };
  reply: (arg0: { content: string; ephemeral: boolean }) => any;
  deferReply: (arg0: { ephemeral: boolean }) => any;
  editReply: (arg0: { content: string }) => any;
}) {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este comando solo puede ser usado en un servidor.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await interaction.guild.members.fetch(); // Ensure all members are cached
    const allRankRoleNames = APEX_RANKS.map((rank) => rank.roleName);
    const uniquePlayersWithRank = new Set<string>();

    for (const roleName of allRankRoleNames) {
      const role = interaction.guild.roles.cache.find(
        (r) => r.name === roleName
      );
      if (role) {
        role.members.forEach((member: { id: string }) => {
          uniquePlayersWithRank.add(member.id);
        });
      }
    }

    await interaction.editReply({
      content: `Total de jugadores con un rol de rango de Apex Legends: **${uniquePlayersWithRank.size}**`,
    });
  } catch (error) {
    console.error('Error al obtener el total de jugadores:', error);
    await interaction.editReply({
      content: 'Hubo un error al intentar obtener el total de jugadores.',
    });
  }
}
