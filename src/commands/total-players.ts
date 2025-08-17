import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { getPlayerStats } from '../utils/player-stats';

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
    const stats = await getPlayerStats(interaction.guild);
    await interaction.editReply({
      content: `Hay un total de **${stats.total}** jugadores con un rol de rango de Apex Legends.`,
    });
  } catch (error) {
    console.error('Error al obtener el total de jugadores:', error);
    await interaction.editReply({
      content: 'Hubo un error al intentar obtener el total de jugadores.',
    });
  }
}