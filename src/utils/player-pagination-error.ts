import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from 'discord.js';
import { createCloseButtonRow } from './button-helper';
import { logApp } from './logger';

/** Resultado de error de una paginación de jugadores. */
export interface PlayerPaginationErrorResult {
  /** Embed de error listo para enviar. */
  embed: EmbedBuilder;
  /** Componentes para cerrar el mensaje. */
  components: ActionRowBuilder<ButtonBuilder>[];
  /** Página informada, siempre 1. */
  page: number;
  /** Total de páginas informado, siempre 1. */
  totalPages: number;
  /** Total de jugadores informado, siempre 0. */
  totalPlayers: number;
}

/**
 * Construye el resultado de error de una paginación.
 *
 * Registra el mensaje, el stack y devuelve un embed de cierre consistente.
 *
 * @param error - Error capturado al armar la paginación.
 * @returns El embed de error y sus componentes.
 */
export async function buildPlayerPaginationError(
  error: unknown
): Promise<PlayerPaginationErrorResult> {
  await logApp(
    `[createPlayerPaginationEmbed] ❌ ERROR al generar lista de jugadores: ${
      error instanceof Error ? error.message : String(error)
    }`
  );
  await logApp(
    `[createPlayerPaginationEmbed] Stack trace: ${
      error instanceof Error ? error.stack : 'N/A'
    }`
  );

  const embed = new EmbedBuilder()
    .setColor('#e74c3c')
    .setTitle('❌ Error al generar lista')
    .setDescription('Hubo un error al procesar la lista de jugadores.')
    .setTimestamp();

  return {
    embed,
    components: [createCloseButtonRow()],
    page: 1,
    totalPages: 1,
    totalPlayers: 0,
  };
}
