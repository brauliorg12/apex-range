import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Guild,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';

export function createRankButtons(
  client: Client,
  guild: Guild
): ActionRowBuilder<ButtonBuilder>[] {
  const buildButtons = (ranks: typeof APEX_RANKS) => {
    return ranks.map((rank) => {
      return new ButtonBuilder()
        .setCustomId(rank.shortId)
        .setLabel(rank.label)
        .setEmoji(getRankEmoji(client, rank))
        .setStyle(ButtonStyle.Secondary);
    });
  };

  const row1Buttons = buildButtons(APEX_RANKS.slice(0, 4));
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(row1Buttons);

  const row2Buttons = buildButtons(APEX_RANKS.slice(4));
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(row2Buttons);

  return [row1, row2];
}

export function createManagementButtons(): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_all_players_menu')
      .setLabel('Ver todos los jugadores')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_more_options')
      .setLabel('Filtrar')
      .setEmoji('🔎')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('manage_rank_menu')
      .setLabel('Gestionar mi Rango')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_help_menu')
      .setLabel('Ayuda de Comandos')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary)
  );

  return row;
}

export function createCloseButtonRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('close_help_menu')
      .setLabel('Cerrar')
      .setStyle(ButtonStyle.Secondary)
  );
}

export function createMoreOptionsButtonRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_more_options')
      .setLabel('Filtrar')
      .setEmoji('🔎')
      .setStyle(ButtonStyle.Secondary)
  );
}
