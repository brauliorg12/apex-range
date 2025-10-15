import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  UserContextMenuCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import {
  createRankButtons,
  createManagementButtons,
  createCloseButtonRow,
} from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getPlayerData } from '../utils/player-data-manager';
import { PlayerRecord } from '../interfaces/player';
import {
  PC_ONLY_EMOGI,
  PLAYSTATION_EMOGI,
  XBOX_EMOGI,
  NINTENDO_SWITCH_EMOGI,
} from '../models/constants';

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

    // Busca si tiene algún rol de rango (usar roles mapeados)
    const ranks = getApexRanksForGuild(interaction.guild.id, interaction.guild);
    const userRank = ranks.find((rank) =>
      member.roles.cache.some((role) => role.name === rank.roleName)
    );

    // Obtener datos del jugador para mostrar plataforma
    const playerData = await getPlayerData(interaction.guild);
    const playerRecord = (playerData as PlayerRecord[]).find(
      (p) => p.userId === interaction.targetId
    );

    // Usa el botón cerrar global del helper
    const closeButton = createCloseButtonRow();

    if (userRank) {
      const emoji = getRankEmoji(interaction.client, userRank);
      const isSelf = interaction.user.id === interaction.targetId;
      const displayName = member.displayName || member.user.username;

      // Mapeo de plataformas a emojis personalizados de Discord
      const platformEmojis: Record<string, string> = {
        PC: PC_ONLY_EMOGI,
        PS4: PLAYSTATION_EMOGI,
        PS5: PLAYSTATION_EMOGI,
        X1: XBOX_EMOGI,
        SWITCH: NINTENDO_SWITCH_EMOGI,
      };
      const platformNames: Record<string, string> = {
        PC: 'PC',
        PS4: 'PlayStation',
        PS5: 'PlayStation',
        X1: 'Xbox',
        SWITCH: 'Nintendo Switch',
      };

      const platformIcon = playerRecord?.platform
        ? platformEmojis[playerRecord.platform] || PLAYSTATION_EMOGI
        : '';
      const platformName = playerRecord?.platform
        ? platformNames[playerRecord.platform] || playerRecord.platform
        : 'No especificada';

      const embed = new EmbedBuilder()
        .setColor((userRank.color as any) || '#95a5a6')
        .setTitle(
          isSelf ? 'Tu rango en Apex Legends' : `Rango de ${displayName}`
        )
        .setDescription(
          isSelf
            ? `Actualmente tienes el rango: ${emoji} **${userRank.label}**\nPlataforma: ${platformIcon} **${platformName}**`
            : `El rango de <@${member.id}> es: ${emoji} **${userRank.label}**\nPlataforma: ${platformIcon} **${platformName}**`
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
          ? [
              ...createRankButtons(interaction.client, interaction.guild),
              closeButton,
            ]
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
