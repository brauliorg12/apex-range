import {
  ActionRowBuilder,
  ModalBuilder,
  StringSelectMenuInteraction,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { logInteraction } from '../../utils/logger';
import { handleShowAllPlayersMenu } from '../player-list';

/**
 * Asynchronously handles select menu interactions initiated by users.
 *
 * This function is responsible for processing user selections from string select menus.
 * It uses the `customId` of the interaction to identify the specific menu being used.
 * Current implementations include handling platform selection for Apex Legends profiles,
 * which then triggers a modal for username input, and filtering online players by their rank.
 * It includes error handling to ensure a smooth user experience.
 *
 * @param {StringSelectMenuInteraction} interaction The select menu interaction object from discord.js.
 */
export async function handleSelectMenuInteraction(
  interaction: StringSelectMenuInteraction
) {
  try {
    await logInteraction({
      type: 'SelectMenu',
      userTag: interaction.user.tag,
      userId: interaction.user.id,
      guildName: interaction.guild?.name,
      guildId: interaction.guild?.id,
      customId: interaction.customId,
    });

    const { customId } = interaction;

    if (customId === 'apex_platform_select') {
      const selectedPlatform = interaction.values[0];
      const modal = new ModalBuilder()
        .setCustomId(`apex_profile_modal_${selectedPlatform}`)
        .setTitle('Consulta tu perfil de Apex Legends');

      const nameInput = new TextInputBuilder()
        .setCustomId('apex_name')
        .setLabel('Nombre de usuario de Apex Legends')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ejemplo: Burlon23')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput)
      );

      await interaction.showModal(modal);
      return;
    }
    // --- RESTAURA EL BLOQUE PARA FILTRO DE RANGO ---
    else if (customId === 'RANK_FILTER') {
      const selectedRankShortId = interaction.values[0];
      // Solo mostrar los jugadores en línea para el filtro
      await handleShowAllPlayersMenu(interaction, selectedRankShortId, true);
      return;
    }
    // ------------------------------------------------
  } catch (error) {
    console.error('Error en handleSelectMenuInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al procesar el menú.',
        ephemeral: true,
      });
    }
  }
}
