import type { ButtonInteraction } from 'discord.js';
import { logApp } from '../utils/logger';
import { getQueryForMessage } from './player-search-query-cache';

/**
 * Recupera la query de una navegación de páginas del buscador.
 *
 * Primero consulta la cache asociada al mensaje y, si no la encuentra, intenta
 * extraerla del título del embed. Nunca lanza: si no hay query disponible
 * devuelve `undefined` para que el llamador responda el error correspondiente.
 *
 * @param interaction - Interacción del botón de navegación.
 * @returns La query recuperada o `undefined`.
 */
export function recoverSearchQuery(
  interaction: ButtonInteraction
): string | undefined {
  let query: string | undefined;

  try {
    const messageId = interaction.message?.id;
    if (messageId) {
      const cachedQuery = getQueryForMessage(messageId);
      if (cachedQuery) {
        query = cachedQuery;
        try {
          void logApp(
            `[player-search] Recovered cached query for message ${messageId}`
          );
        } catch {
          // Ignorar fallos de log.
        }
      }
    }
  } catch {
    // Ignorar errores de acceso al mensaje.
  }

  if (query) return query;

  try {
    const title = interaction.message?.embeds?.[0]?.title;
    if (title) {
      const match = title.match(/^Resultados de búsqueda:\s*(.+)$/i);
      if (match) {
        return match[1].trim();
      }
    }
  } catch {
    // No bloquear: sin query se responde en el llamador.
  }

  return undefined;
}
