import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
} from 'discord.js';
import type { ApexRank } from '../interfaces/apex-rank';
import { createCloseButtonRow } from './button-helper';
import { getRankEmoji } from './emoji-helper';

/**
 * Crea una fila con el botón "Ver más jugadores" solo si hay más jugadores que el máximo por card.
 * Esta función se usa en los mensajes persistentes del canal público.
 *
 * @param rank - Rango del card.
 * @param totalCount - Cantidad total de jugadores del rango.
 * @param maxPerCard - Máximo de jugadores por card.
 * @param client - Cliente de Discord para resolver el emoji del rango.
 * @returns La fila con el botón o un array vacío.
 */
export function createSeeMoreButtonRow(
  rank: ApexRank,
  totalCount: number,
  maxPerCard: number,
  client: Client
) {
  if (totalCount > maxPerCard) {
    const rankEmoji = getRankEmoji(client, rank) || '🎯';
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`rank_${rank.shortId}_vermas`)
          .setLabel('Ver más')
          .setEmoji(rankEmoji)
          .setStyle(ButtonStyle.Secondary)
      ),
    ];
  }
  return [];
}

/**
 * Crea los botones de paginación para un rango (servidores pequeños).
 *
 * @param rankId - shortId del rango.
 * @param currentPage - Página actual.
 * @param totalPages - Total de páginas.
 * @returns Filas de botones de navegación.
 */
export function createPaginationButtons(
  rankId: string,
  currentPage: number,
  totalPages: number
) {
  if (totalPages <= 1) return [createCloseButtonRow()];

  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_prev_${currentPage}`)
      .setLabel('⬅️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_next_${currentPage}`)
      .setLabel('Siguiente ➡️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
    ...createCloseButtonRow().components
  );
  return [row];
}
