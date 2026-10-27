import * as fs from 'fs/promises';
import type { PlayerRecord } from '../interfaces/player';
import { getPlayersFile } from './state-files';

/**
 * Snapshot en memoria de `players_*.json` para un guild.
 *
 * El array `players` es de solo lectura: los consumidores no deben mutarlo.
 * La frescura se valida contra `mtimeMs` y `size`, de modo que una restauración
 * o una edición externa fuerza una relectura.
 */
export interface CachedPlayersSnapshot {
  /** Registros parseados del archivo; no mutar. */
  players: PlayerRecord[];
  /** Contenido textual leído o escrito, usado como base de comparación. */
  raw: string;
  /** Fecha de modificación del archivo al leerlo o escribirlo. */
  mtimeMs: number;
  /** Tamaño del archivo en bytes al leerlo o escribirlo. */
  size: number;
}

/** Cache por guild de snapshots de jugadores. */
const playersSnapshotCache = new Map<string, CachedPlayersSnapshot>();

/**
 * Obtiene el snapshot cacheado de un guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns El snapshot o `undefined` si no está cacheado.
 */
export function getCachedPlayersSnapshot(
  guildId: string
): CachedPlayersSnapshot | undefined {
  return playersSnapshotCache.get(guildId);
}

/**
 * Guarda un snapshot usando el `mtimeMs` y el `size` actuales del archivo.
 *
 * Si el archivo ya no se puede inspeccionar, invalida la entrada. No propaga
 * errores porque la cache es solo una optimización de I/O.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param players - Registros parseados; el llamador no debe mutarlos después.
 * @param raw - Contenido textual canónico leído o escrito.
 */
export async function cachePlayersSnapshot(
  guildId: string,
  players: PlayerRecord[],
  raw: string
): Promise<void> {
  try {
    const stats = await fs.stat(getPlayersFile(guildId));
    playersSnapshotCache.set(guildId, {
      players,
      raw,
      mtimeMs: stats.mtimeMs,
      size: stats.size,
    });
  } catch {
    playersSnapshotCache.delete(guildId);
  }
}

/**
 * Invalida el snapshot cacheado de un guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 */
export function invalidatePlayersCache(guildId: string): void {
  playersSnapshotCache.delete(guildId);
}
