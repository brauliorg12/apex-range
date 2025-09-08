import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { getGlobalApiStatus } from '../utils/global-api-status';

/**
 * Definición del comando /api-status para Discord.
 *
 * Utiliza SlashCommandBuilder para registrar el comando que muestra el estado actual de la API externa.
 * Incluye el nombre y la descripción que aparecerán en Discord.
 */
export const data = new SlashCommandBuilder()
  .setName('api-status')
  .setDescription('Muestra el estado actual de la API externa.');

/**
 * Ejecuta el comando /api-status.
 *
 * - Consulta el estado actual de la API externa utilizada por el bot.
 * - Muestra un embed con el estado de conexión (conectado/desconectado) y la última vez que se verificó.
 * - El mensaje es efímero, solo visible para el usuario que ejecuta el comando.
 *
 * @param interaction Interacción del comando recibida desde Discord.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  const status = getGlobalApiStatus();
  const color = status.ok ? 0x2ecc71 : 0xe74c3c;
  const estado = status.ok ? '🟢 Conectado' : '🔴 Desconectado';
  const lastChecked = status.lastChecked
    ? status.lastChecked.toLocaleString()
    : 'Nunca';

  const embed = new EmbedBuilder()
    .setTitle('Estado de la API')
    .setColor(color)
    .addFields(
      { name: 'Estado', value: estado, inline: true },
      { name: 'Última verificación', value: lastChecked, inline: true }
    );

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
