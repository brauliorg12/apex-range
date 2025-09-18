import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import {
  createRankButtons,
  createManagementButtons,
  createCloseButtonRow,
} from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';

/**
 * Definición del comando contextual "Ver mi rango en Apex Range" para Discord.
 *
 * Utiliza ContextMenuCommandBuilder para registrar el comando que permite consultar el rango de Apex Legends
 * de cualquier usuario al hacer clic derecho sobre él en Discord.
 * El nombre y el tipo aparecerán en el menú contextual de usuario.
 */
export const data = new ContextMenuCommandBuilder()
  .setName('Ver mi rango en Apex Range')
  .setType(ApplicationCommandType.User);

/**
 * Ejecuta el comando contextual "Ver mi rango en Apex Range".
 *
 * - Busca el miembro objetivo en el servidor.
 * - Si el usuario es un bot, muestra un mensaje especial.
 * - Si el usuario tiene un rol de rango de Apex, muestra su rango y botones de gestión.
 * - Si no tiene rango, muestra botones para seleccionar rango (solo si es el propio usuario).
 * - El mensaje es efímero y solo visible para el usuario que ejecuta el comando.
 * - Maneja errores mostrando mensajes claros al usuario.
 *
 * @param interaction Interacción del menú contextual de usuario recibida desde Discord.
 */
export async function execute(interaction: UserContextMenuCommandInteraction) {
  try {
    if (!interaction.guild || !interaction.guildId) return;

    const member = await interaction.guild.members.fetch(interaction.targetId);

    // Si el objetivo es un bot, muestra un mensaje especial
    if (member.user.bot) {
      await interaction.reply({
        content: 'Este comando no está disponible para bots.',
        ephemeral: true,
      });
      return;
    }

    // Busca si tiene algún rol de rango
    const userRank = APEX_RANKS.find((rank) =>
      member.roles.cache.some((role) => role.name === rank.roleName)
    );

    // Usa el botón cerrar global del helper
    const closeButton = createCloseButtonRow();

    if (userRank) {
      const emoji = getRankEmoji(interaction.client, userRank);
      const isSelf = interaction.user.id === interaction.targetId;
      const displayName = member.displayName || member.user.username;

      const embed = new EmbedBuilder()
        .setColor((userRank.color as any) || '#95a5a6')
        .setTitle(
          isSelf ? 'Tu rango en Apex Legends' : `Rango de ${displayName}`
        )
        .setDescription(
          isSelf
            ? `Actualmente tienes el rango: ${emoji} **${userRank.label}**`
            : `El rango de <@${member.id}> es: ${emoji} **${userRank.label}**`
        );

      await interaction.reply({
        embeds: [embed],
        components: [...createManagementButtons(), closeButton],
        ephemeral: true,
      });
    } else {
      // Si no tiene rango, muestra los botones para seleccionar rango
      const isSelf = interaction.user.id === interaction.targetId;

      const embed = new EmbedBuilder()
        .setColor('#95a5a6')
        .setTitle(isSelf ? 'No tienes rango asignado' : `Sin rango asignado`)
        .setDescription(
          isSelf
            ? 'Selecciona tu rango actual en Apex Legends:'
            : `<@${member.id}> aún no tiene rango asignado.`
        );

      await interaction.reply({
        embeds: [embed],
        components: isSelf
          ? [...createRankButtons(interaction.client), closeButton]
          : [closeButton],
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error('Error en show-my-rank:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al mostrar el rango.',
        ephemeral: true,
      });
    }
  }
}
