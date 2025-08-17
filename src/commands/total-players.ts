import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { getTotalUniquePlayers } from '../utils/player-stats';

export const data = new SlashCommandBuilder()
  .setName('total-jugadores')
  .setDescription(
    'Muestra el número total de jugadores con un rol de rango de Apex Legends.'
  );

export async function execute(interaction: CommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: 'Este comando solo puede ser usado en un servidor.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const totalPlayers = await getTotalUniquePlayers(interaction.guild);
    await interaction.editReply({
      content: `Total de jugadores con un rol de rango de Apex Legends: **${totalPlayers}**`,
    });
  } catch (error) {
    console.error('Error al obtener el total de jugadores:', error);
    await interaction.editReply({
      content: 'Hubo un error al intentar obtener el total de jugadores.',
    });
  }
}
