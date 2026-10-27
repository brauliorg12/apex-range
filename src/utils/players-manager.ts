import type { PlayerRecord } from '../interfaces/player';
import { readPlayersCached } from './state-manager';

/**
 * Obtiene la lista de jugadores registrados para un servidor específico.
 *
 * Reutiliza el snapshot cacheado mientras el archivo conserve su `mtimeMs` y
 * `size`; si cambió, se relee desde disco.
 *
 * @param guildId ID del servidor Discord.
 * @returns Un array de jugadores registrados en ese servidor.
 */
export async function getPlayers(guildId: string): Promise<PlayerRecord[]> {
  return readPlayersCached(guildId);
}
