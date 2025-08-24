import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
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
  }
}
