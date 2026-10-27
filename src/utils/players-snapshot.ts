import * as fs from 'fs/promises';
import type { PlayerRecord } from '../interfaces/player';
import {
  cachePlayersSnapshot,
  getCachedPlayersSnapshot,
  invalidatePlayersCache,
} from './players-cache';
import { readPlayersStrict } from './players-state';
import type { PlayersReadResult } from './players-state';
import { getPlayersFile } from './state-files';

/**
 * Indica si el snapshot cacheado sigue correspondiendo al archivo actual.
 *
 * La comparación usa `mtimeMs` y `size` para detectar restauraciones o
 * ediciones externas sin parsear el archivo. Un `stat` fallido se trata como
 * cache inválida.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param snapshot - Snapshot cacheado a validar.
 * @returns `true` si el archivo conserva el mismo `mtimeMs` y `size`.
 */
async function isSnapshotFresh(
  guildId: string,
  snapshot: { mtimeMs: number; size: number }
): Promise<boolean> {
  try {
    const stats = await fs.stat(getPlayersFile(guildId));
    return stats.mtimeMs === snapshot.mtimeMs && stats.size === snapshot.size;
  } catch {
    return false;
  }
}

/**
 * Lee los jugadores de un guild usando la cache por guild cuando sigue fresca.
 *
 * Antes de reutilizar el snapshot hace un `stat` y compara `mtimeMs` y `size`.
 * Si el archivo cambió, desapareció o falló el `stat`, invalida la cache y
 * delega en `readPlayersStrict`, que mantiene los estados `missing`, `invalid`
 * e `io-error`. El array del estado `ok` es de solo lectura.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns El resultado tipado de la lectura.
 * @throws {Error} Si el guildId no es válido o no se puede preparar el
 *   directorio.
 */
export async function readPlayersCachedStrict(
  guildId: string
): Promise<PlayersReadResult> {
  const cached = getCachedPlayersSnapshot(guildId);

  if (cached) {
    if (await isSnapshotFresh(guildId, cached)) {
      return { status: 'ok', players: cached.players, raw: cached.raw };
    }

    invalidatePlayersCache(guildId);
  }

  const result = await readPlayersStrict(guildId);

  if (result.status === 'ok') {
    await cachePlayersSnapshot(
      guildId,
      result.players as PlayerRecord[],
      result.raw
    );
  }

  return result;
}

/**
 * Lee los jugadores de un guild con la misma tolerancia que `readPlayers`,
 * pero reutilizando la cache mientras el archivo no cambie.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns Los registros cacheados o un array vacío si la lectura no es `ok`.
 * @throws {Error} Si el guildId no es válido o no se puede preparar el
 *   directorio.
 */
export async function readPlayersCached(
  guildId: string
): Promise<PlayerRecord[]> {
  const result = await readPlayersCachedStrict(guildId);
  return result.status === 'ok' ? (result.players as PlayerRecord[]) : [];
}
