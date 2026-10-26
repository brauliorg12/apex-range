import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
} from 'discord.js';
import { createCloseButtonRow } from './button-helper';

/** Límites y miembros de la página actual. */
export interface PlayerPaginationBounds {
  /** Total de jugadores. */
  totalPlayers: number;
  /** Total de páginas. */
  totalPages: number;
  /** Página normalizada dentro del rango válido. */
  pageNum: number;
  /** Índice inicial de la página. */
  startIdx: number;
  /** Índice final exclusivo de la página. */
  endIdx: number;
  /** Miembros incluidos en la página. */
  pageMembers: GuildMember[];
}

/**
 * Calcula los límites y miembros de la página solicitada.
 *
 * @param members - Miembros a paginar.
 * @param page - Página solicitada, empezando en 1.
 * @param playersPerPage - Cantidad de jugadores por página.
 * @returns Límites calculados y miembros de la página.
 */
export function calculatePlayerPagination(
  members: GuildMember[],
  page: number,
  playersPerPage: number
): PlayerPaginationBounds {
  const totalPlayers = members.length;
  const totalPages = Math.ceil(totalPlayers / playersPerPage);
  const pageNum = Math.max(1, Math.min(page, totalPages));
  const startIdx = (pageNum - 1) * playersPerPage;
  const endIdx = startIdx + playersPerPage;

  return {
    totalPlayers,
    totalPages,
    pageNum,
    startIdx,
    endIdx,
    pageMembers: members.slice(startIdx, endIdx),
  };
}

/**
 * Construye los componentes de navegación de la paginación.
 *
 * @param pageNum - Página actual normalizada.
 * @param totalPages - Total de páginas.
 * @param buttonIdPrefix - Prefijo de los customId de navegación.
 * @returns Filas de botones listas para el mensaje.
 */
export function buildPlayerPaginationComponents(
  pageNum: number,
  totalPages: number,
  buttonIdPrefix: string
): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>();

    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`${buttonIdPrefix}_prev_${Math.max(1, pageNum - 1)}`)
        .setLabel('⬅️ Anterior')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pageNum === 1)
    );

    navRow.addComponents(
      new ButtonBuilder()
        .setCustomId(
          `${buttonIdPrefix}_next_${Math.min(totalPages, pageNum + 1)}`
        )
        .setLabel('Siguiente ➡️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageNum === totalPages)
    );

    navRow.addComponents(...createCloseButtonRow().components);
    components.push(navRow);
  } else {
    components.push(createCloseButtonRow());
  }

  return components;
}
