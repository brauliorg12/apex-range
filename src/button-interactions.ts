import { ButtonInteraction } from 'discord.js';
import { APEX_RANKS } from './constants';
import {
  handleManageRankMenu,
  handleRoleAssignment,
  handleRemoveRank,
} from './interactions/rank-management';
import {
  handleShowOnlinePlayersMenu,
  handleShowOnlineByRank,
} from './interactions/online-players';
import { handleHelpMenu, handleCloseHelpMenu } from './interactions/help-menu';

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  const { customId } = interaction;

  if (customId === 'manage_rank_menu') {
    await handleManageRankMenu(interaction);
  } else if (APEX_RANKS.some((rank) => rank.shortId === customId)) {
    await handleRoleAssignment(interaction);
  } else if (customId === 'remove_apex_rank') {
    await handleRemoveRank(interaction);
  } else if (customId === 'show_online_players_menu') {
    await handleShowOnlinePlayersMenu(interaction);
  } else if (customId.startsWith('show_online_rank_')) {
    await handleShowOnlineByRank(interaction);
  } else if (customId === 'show_help_menu') {
    await handleHelpMenu(interaction);
  } else if (customId === 'close_help_menu') {
    await handleCloseHelpMenu(interaction);
  }
}
