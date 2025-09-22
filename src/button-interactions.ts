import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { APEX_RANKS } from './models/constants';
import { createCloseButtonRow } from './utils/button-helper';
import {
  handleManageRankMenu,
  handleRoleAssignment,
  handleManagePlatform,
  handleSetPlatform,
} from './interactions/rank-management';
import { handleShowAllPlayersMenu } from './interactions/player-list';
import { handleHelpMenu, handleCloseHelpMenu } from './interactions/help-menu';
import { handleRemoveRank } from './helpers/handle-remove-rank';
import { logInteraction } from './utils/logger';
import { handleSetupConfirmation } from './interactions/setup-confirmation-handler';
import {
  handleBackToModes,
  handleCancelSetup,
} from './interactions/setup-navigation';
import { handleModoAuto } from './interactions/handlers/setup-modes-auto';
import {
  handleModoManual,
  handleOpenManualModal,
} from './interactions/handlers/setup-modes-manual';
import { handleModoExistente } from './interactions/handlers/setup-modes-existente';

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
    // Crear logger específico para este servidor
    await logInteraction({
      type: 'Button',
      userTag: interaction.user.tag,
      userId: interaction.user.id,
      guildName: interaction.guild?.name,
      guildId: interaction.guild?.id,
      customId: interaction.customId,
    });

    const { customId } = interaction;

    if (customId === 'manage_rank_menu') {
      await handleManageRankMenu(interaction);
    } else if (APEX_RANKS.some((rank) => rank.shortId === customId)) {
      await handleRoleAssignment(interaction);
    } else if (customId === 'manage_platform') {
      await handleManagePlatform(interaction);
    } else if (customId.startsWith('set_platform_')) {
      await handleSetPlatform(interaction);
    } else if (customId === 'remove_apex_rank') {
      await handleRemoveRank(interaction);
    } else if (customId === 'show_all_players_menu') {
      await handleShowAllPlayersMenu(interaction);
    } else if (customId === 'show_help_menu') {
      await handleHelpMenu(interaction);
    } else if (customId === 'close_help_menu') {
      await handleCloseHelpMenu(interaction);
    } else if (customId === 'modo_auto') {
      await handleModoAuto(interaction);
    } else if (customId === 'modo_manual') {
      await handleModoManual(interaction);
    } else if (customId === 'open_manual_modal') {
      await handleOpenManualModal(interaction);
    } else if (customId === 'modo_existente') {
      await handleModoExistente(interaction);
    } else if (customId === 'confirm_auto') {
      await handleSetupConfirmation(interaction, 'auto');
    } else if (customId === 'confirm_manual') {
      await handleSetupConfirmation(interaction, 'manual');
    } else if (customId.startsWith('confirm_manual_')) {
      // Extraer nombres de canales del customId
      const parts = customId.split('_');
      if (parts.length >= 4) {
        const adminChannelName = parts[2];
        const panelChannelName = parts[3];

        // Pasar los nombres como opciones adicionales
        const options = {
          canal_admin: adminChannelName,
          canal_publico: panelChannelName,
        };

        await handleSetupConfirmation(interaction, 'manual', options);
      } else {
        await handleSetupConfirmation(interaction, 'manual');
      }
    } else if (customId.startsWith('confirm_existente_')) {
      // Extraer IDs de canales del customId
      const parts = customId.split('_');
      if (parts.length >= 4) {
        const adminChannelId = parts[2];
        const panelChannelId = parts[3];

        // Obtener los canales del servidor
        const adminChannel =
          interaction.guild?.channels.cache.get(adminChannelId);
        const panelChannel =
          interaction.guild?.channels.cache.get(panelChannelId);

        if (!adminChannel || !panelChannel) {
          await interaction.reply({
            content: '❌ Uno o ambos canales seleccionados ya no existen.',
            ephemeral: true,
          });
          return;
        }

        // Pasar los canales como opciones adicionales
        const options = {
          canal_admin: adminChannelId,
          canal_publico: panelChannelId,
        };

        await handleSetupConfirmation(interaction, 'existente', options);
      } else {
        await handleSetupConfirmation(interaction, 'existente');
      }
    } else if (customId === 'back_to_modes') {
      await handleBackToModes(interaction);
    } else if (customId === 'cancel_setup') {
      await handleCancelSetup(interaction);
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
        content: 'Filtra los jugadores 🟢 en línea por rango:',
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
