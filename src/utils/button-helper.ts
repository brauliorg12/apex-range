import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
} from 'discord.js';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';

/**
 * Crea los botones de selección de rango para el panel principal.
 * Cada botón representa un rango de Apex y muestra su emoji y nombre.
 * Los botones se dividen en filas de máximo 5 por fila, como requiere Discord.
 * @param client Cliente de Discord.
 * @returns Array de ActionRowBuilder<ButtonBuilder> con los botones de rango.
 */
export function createRankButtons(
  client: Client
): ActionRowBuilder<ButtonBuilder>[] {
  const buttons = APEX_RANKS.map((rank) =>
    new ButtonBuilder()
      .setCustomId(rank.shortId)
      .setLabel(rank.label)
      .setEmoji(getRankEmoji(client, rank))
      .setStyle(ButtonStyle.Secondary)
  );

  // Divide en filas de máximo 5 botones
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    rows.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        buttons.slice(i, i + 5)
      )
    );
  }
  return rows;
}

export function createManagementButtons(): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('show_apex_profile_modal')
      .setLabel('Ver mi perfil Apex')
      .setStyle(ButtonStyle.Primary),
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
