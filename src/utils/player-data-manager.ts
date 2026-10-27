import { Guild } from 'discord.js';
import { getPlayers } from './players-manager';
import {
  mutatePlayers,
  readPlayersCached,
  readPlayersCachedStrict,
} from './state-manager';
import type { PlayersReadResult } from './state-manager';
import type { PlayerData, PlayerRecord } from '../interfaces/player';

export type { PlayerLookup } from './player-lookup';
export {
  buildAssignedAtByUserId,
  buildPlayerLookup,
} from './player-lookup';

/**
 * Obtiene todos los jugadores registrados para un servidor específico.
 *
 * Reutiliza el snapshot cacheado mientras el archivo conserve su `mtimeMs` y
 * `size`. El array devuelto es de solo lectura y no debe mutarse.
 *
 * @param guild - El servidor de Discord para el cual obtener los datos de jugadores
 * @returns Promise que resuelve a un array de registros de jugadores (PlayerRecord[])
 */
export async function getPlayerData(guild: Guild): Promise<PlayerData> {
  return getPlayers(guild.id);
}

/**
 * Obtiene un snapshot estricto de los jugadores registrados de un servidor,
 * distinguiendo archivo ausente, JSON inválido y error de IO.
 *
 * Reutiliza la cache por guild mientras el archivo conserve su `mtimeMs` y
 * `size`; una restauración o edición externa fuerza una relectura. El array
 * devuelto es de solo lectura.
 *
 * @param guild - El servidor de Discord.
 * @returns El resultado tipado de la lectura.
 * @throws {Error} Si el guildId es inválido o no se puede preparar el directorio.
 */
export async function getPlayerDataSnapshot(
  guild: Guild
): Promise<PlayersReadResult> {
  return readPlayersCachedStrict(guild.id);
}

/**
 * Actualiza o crea el registro de un jugador en la base de datos del servidor.
 * Si el jugador ya existe, actualiza su fecha de asignación y opcionalmente su
 * rango y plataforma. Si no existe, crea un nuevo registro.
 *
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @param rank - shortId del rango; `''` limpia el rango y `undefined` conserva
 *   el existente
 * @param platform - Plataforma del jugador (por defecto 'PC')
 * @returns Promise que se resuelve cuando se completa la actualización
 * @throws {Error} Si el archivo de jugadores no es legible o falla la escritura
 */
export async function updatePlayerRankDate(
  guildId: string,
  userId: string,
  rank?: string,
  platform: string = 'PC'
): Promise<void> {
  await mutatePlayers(guildId, (players) => {
    const player = players.find((record) => record.userId === userId);
    const now = new Date().toISOString();

    if (player) {
      player.assignedAt = now;
      if (rank !== undefined) player.rank = rank;
      player.platform = platform;
      return;
    }

    players.push({ userId, assignedAt: now, rank: rank || '', platform });
  });
}

/**
 * Obtiene la plataforma de juego de un usuario específico en un servidor.
 *
 * Usa la lectura cacheada para las consultas puntuales. Si hay registros
 * duplicados gana el primero, igual que el `find` histórico.
 *
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @returns Promise que resuelve al nombre de la plataforma ('PC', 'PS4', 'X1', 'SWITCH') o '' si no se encuentra
 */
export async function getPlayerPlatform(
  guildId: string,
  userId: string
): Promise<string> {
  const data = await readPlayersCached(guildId);
  const player = data.find((record) => record.userId === userId);
  return player?.platform || '';
}

/**
 * Actualiza solo la plataforma de un usuario sin cambiar la fecha de asignación.
 * Útil para cambios manuales de roles de plataforma.
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @param platform - Nueva plataforma del jugador
 * @returns Promise que se resuelve cuando se completa la actualización
 * @throws {Error} Si el archivo de jugadores no es legible o falla la escritura
 */
export async function updatePlayerPlatform(
  guildId: string,
  userId: string,
  platform: string
): Promise<void> {
  await mutatePlayers(guildId, (players) => {
    const player = players.find((record) => record.userId === userId);

    if (player) {
      player.platform = platform;
      return;
    }

    players.push({
      userId,
      assignedAt: new Date().toISOString(),
      rank: '',
      platform,
    });
  });
}

/**
 * Elimina completamente el registro de un jugador de la base de datos del servidor.
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord cuyo registro será eliminado
 * @returns Promise que se resuelve cuando se completa la eliminación
 * @throws {Error} Si el archivo de jugadores no es legible o falla la escritura
 */
export async function removePlayerRankDate(
  guildId: string,
  userId: string
): Promise<void> {
  await mutatePlayers(guildId, (players) => {
    const idx = players.findIndex((record) => record.userId === userId);
    if (idx >= 0) {
      players.splice(idx, 1);
    }
  });
}

/**
 * Elimina la plataforma de un usuario específico en un servidor, dejando el resto del registro intacto.
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @returns Promise que se resuelve cuando se completa la eliminación
 * @throws {Error} Si el archivo de jugadores no es legible o falla la escritura
 */
export async function removePlayerPlatform(
  guildId: string,
  userId: string
): Promise<void> {
  await mutatePlayers(guildId, (players) => {
    const player = players.find((record) => record.userId === userId);
    if (player) {
      player.platform = '';
    }
  });
}
