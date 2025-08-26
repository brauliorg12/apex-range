import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuInteraction,
} from 'discord.js';
import { APEX_RANKS } from './constants';
import { createCloseButtonRow } from './utils/button-helper';
import {
  handleManageRankMenu,
  handleRoleAssignment,
  handleRemoveRank,
} from './interactions/rank-management';
import { handleShowOnlineByRank } from './interactions/online-players';
import { handleShowAllPlayersMenu } from './interactions/player-list';
import { handleHelpMenu, handleCloseHelpMenu } from './interactions/help-menu';

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
    } else if (customId.startsWith('show_online_rank_')) {
      await handleShowOnlineByRank(interaction);
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
      const modal = new ModalBuilder()
        .setCustomId('apex_profile_modal')
        .setTitle('Consulta tu perfil de Apex Legends')
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('apex_name')
              .setLabel('Nombre de usuario de Apex Legends')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('Ejemplo: Burlon23')
              .setRequired(true)
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId('apex_platform')
              .setLabel('Plataforma (PC, PS4, X1)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('PC, PS4 o X1')
              .setRequired(true)
          )
        );

      await interaction.showModal(modal);
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
