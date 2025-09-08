import { SlashCommandBuilder, CommandInteraction } from 'discord.js';
import { getPlayerStats } from '../utils/player-stats';

/**
 * Definición del comando /total-jugadores para Discord.
 *
 * Utiliza SlashCommandBuilder para registrar el comando que muestra el número total de jugadores
 * con un rol de rango de Apex Legends en el servidor.
 * El nombre y la descripción aparecerán en Discord al desplegar el comando.
 */
export const data = new SlashCommandBuilder()
  .setName('total-jugadores')
  .setDescription(
    'Muestra el número total de jugadores con un rol de rango de Apex Legends.'
  );

/**
 * Ejecuta el comando /total-jugadores.
 *
 * - Verifica que el comando se ejecute dentro de un servidor.
 * - Obtiene el número total de jugadores con un rol de rango de Apex Legends en el servidor.
 * - Muestra el resultado en un mensaje efímero para el usuario.
 * - Maneja errores mostrando mensajes claros si ocurre algún problema.
 *
 * @param interaction Interacción del comando recibida desde Discord.
 */
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
