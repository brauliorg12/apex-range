import { logApp } from '../utils/logger';

/** Tiempo de vida de la entrada de búsqueda en milisegundos. */
const QUERY_CACHE_TTL = 10 * 60 * 1000;

/** Query asociada a cada mensaje de resultados, con su temporizador de limpieza. */
const SEARCH_QUERY_BY_MESSAGE_ID = new Map<
  string,
  { query: string; timeout: ReturnType<typeof setTimeout> }
>();

/**
 * Guarda la query de búsqueda asociada a un mensaje de resultados.
 *
 * Reinicia el temporizador si el mensaje ya tenía una entrada y programa el
 * borrado automático al vencer el TTL.
 *
 * @param messageId - ID del mensaje de resultados.
 * @param query - Texto buscado.
 */
export function storeQueryForMessage(messageId: string, query: string): void {
  const existing = SEARCH_QUERY_BY_MESSAGE_ID.get(messageId);
  if (existing) clearTimeout(existing.timeout);

  const timeout = setTimeout(() => {
    SEARCH_QUERY_BY_MESSAGE_ID.delete(messageId);
  }, QUERY_CACHE_TTL);

  SEARCH_QUERY_BY_MESSAGE_ID.set(messageId, { query, timeout });

  try {
    void logApp(
      `[player-search] Cached query for message ${messageId}: ${query}`
    );
  } catch {
    // Ignorar fallos de log.
  }
}

/**
 * Recupera la query asociada a un mensaje de resultados.
 *
 * @param messageId - ID del mensaje de resultados.
 * @returns La query guardada o `undefined` si no existe o venció el TTL.
 */
export function getQueryForMessage(messageId: string): string | undefined {
  return SEARCH_QUERY_BY_MESSAGE_ID.get(messageId)?.query;
}
