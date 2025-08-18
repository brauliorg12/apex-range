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
      const role = guild.roles.cache.find((r) => r.name === rank.roleName);
      let label = rank.label;
      if (role) {
        const totalCount = role.members.size;
        // Limitar la longitud de la etiqueta para evitar errores de Discord
        const labelText = `${rank.label} - ${totalCount}`;
        label = labelText.length > 80 ? rank.label : labelText;
      }

      return new ButtonBuilder()
        .setCustomId(rank.shortId)
        .setLabel(label)
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
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('manage_rank_menu')
      .setLabel('Gestionar mi Rango')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_all_players_menu')
      .setLabel('Ver todos los jugadores')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_help_menu')
      .setLabel('Ayuda de Comandos')
      .setEmoji('❓')
      .setStyle(ButtonStyle.Secondary)
  );
}

export function createCloseButtonRow(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('close_help_menu')
      .setLabel('Cerrar')
      .setStyle(ButtonStyle.Secondary)
  );
}
