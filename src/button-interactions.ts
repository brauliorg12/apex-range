import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuInteraction,
} from 'discord.js';
import { APEX_RANKS } from './models/constants';
import { createCloseButtonRow } from './utils/button-helper';
import {
  handleManageRankMenu,
  handleRoleAssignment,
  handleRemoveRank,
} from './interactions/rank-management';
import { handleShowAllPlayersMenu } from './interactions/player-list';
import { handleHelpMenu, handleCloseHelpMenu } from './interactions/help-menu';

/**
 * Asynchronously handles button interactions initiated by users.
 *
 * This function serves as a central router for all button clicks within the bot.
 * It retrieves the `customId` from the interaction object to determine which action to perform.
 * Based on the `customId`, it delegates the handling to more specific functions,
 * such as managing ranks, assigning roles, showing player lists, or displaying help menus.
 * It also handles interactions that trigger modals or select menus for further user input.
 * Error handling is included to gracefully manage any issues during the process.
 *
 * @param {ButtonInteraction} interaction The button interaction object from discord.js.
 */
export async function handleButtonInteraction(interaction: ButtonInteraction) {
  try {
    console.log('[DEBUG] handleButtonInteraction', interaction.customId);

    const { customId } = interaction;

    if (customId === 'manage_rank_menu') {
      await handleManageRankMenu(interaction);
    } else if (APEX_RANKS.some((rank) => rank.shortId === customId)) {
      await handleRoleAssignment(interaction);
    } else if (customId === 'remove_apex_rank') {
      await handleRemoveRank(interaction);
    } else if (customId === 'show_all_players_menu') {
      await handleShowAllPlayersMenu(interaction);
    } else if (customId === 'show_help_menu') {
      await handleHelpMenu(interaction);
    } else if (customId === 'close_help_menu') {
      await handleCloseHelpMenu(interaction);
    } else if (customId === 'show_more_options') {
      const rankFilterRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('RANK_FILTER')
            .setPlaceholder('Filtrar por rango')
            .addOptions(
              APEX_RANKS.map((r) => ({ label: r.label, value: r.shortId }))
            )
        );
      const closeButtonRow = createCloseButtonRow();
      await interaction.reply({
        content: 'Filtra los jugadores en línea por rango:',
        components: [rankFilterRow, closeButtonRow],
        ephemeral: true,
      });
      return;
    } else if (customId === 'show_apex_profile_modal') {
      const platformSelectRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('apex_platform_select')
            .setPlaceholder('Selecciona una plataforma')
            .addOptions([
              {
                label: 'PC',
                value: 'PC',
              },
              {
                label: 'PlayStation',
                value: 'PS4',
              },
              {
                label: 'Xbox',
                value: 'X1',
              },
            ])
        );

      const closeButtonRow = createCloseButtonRow();
      await interaction.reply({
        content: 'Por favor, selecciona tu plataforma para continuar.',
        components: [platformSelectRow, closeButtonRow],
        ephemeral: true,
      });
      return;
    }
  } catch (error) {
    console.error('Error en handleButtonInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al procesar el botón.',
        ephemeral: true,
      });
    }
  }
}

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
    console.log('[DEBUG] handleSelectMenuInteraction', interaction.customId);

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
