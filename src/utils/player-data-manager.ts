import { Guild } from 'discord.js';
import { getPlayers, savePlayers } from './players-manager';
import { PlayerData, PlayerRecord } from '../interfaces/player';

/**
 * Obtiene todos los jugadores registrados para un servidor específico.
 * @param guild - El servidor de Discord para el cual obtener los datos de jugadores
 * @returns Promise que resuelve a un array de registros de jugadores (PlayerRecord[])
 */
export async function getPlayerData(guild: Guild): Promise<PlayerData> {
  return getPlayers(guild.id);
}

/**
 * Actualiza o crea el registro de un jugador en la base de datos del servidor.
 * Si el jugador ya existe, actualiza su fecha de asignación y opcionalmente su rango y plataforma.
 * Si no existe, crea un nuevo registro con todos los campos proporcionados.
 *
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @param rank - Nombre del rango asignado (opcional, si no se proporciona mantiene el existente)
 * @param platform - Plataforma del jugador (por defecto 'PC')
 * @returns Promise que se resuelve cuando se completa la actualización
 */
export async function updatePlayerRankDate(
  guildId: string,
  userId: string,
  rank?: string,
  platform: string = 'PC'
): Promise<void> {
  const data = await getPlayers(guildId);
  const idx = data.findIndex((r: PlayerRecord) => r.userId === userId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    data[idx].assignedAt = now;
    if (rank) data[idx].rank = rank;
    data[idx].platform = platform;
  } else {
    data.push({ userId, assignedAt: now, rank: rank || '', platform });
  }
  await savePlayers(guildId, data);
}

/**
 * Obtiene la plataforma de juego de un usuario específico en un servidor.
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord
 * @returns Promise que resuelve al nombre de la plataforma ('PC', 'PS4', 'X1', 'SWITCH') o 'PC' si no se encuentra
 */
export async function getPlayerPlatform(
  guildId: string,
  userId: string
): Promise<string> {
  const data = await getPlayers(guildId);
  const player = data.find((r: PlayerRecord) => r.userId === userId);
  return player?.platform || 'PC'; // Por defecto PC si no se encuentra
}

/**
 * Elimina completamente el registro de un jugador de la base de datos del servidor.
 * @param guildId - ID del servidor de Discord
 * @param userId - ID del usuario de Discord cuyo registro será eliminado
 * @returns Promise que se resuelve cuando se completa la eliminación
 */
export async function removePlayerRankDate(
  guildId: string,
  userId: string
): Promise<void> {
  const data = await getPlayers(guildId);
  const next = data.filter((r: PlayerRecord) => r.userId !== userId);
  if (next.length !== data.length) {
    await savePlayers(guildId, next);
  }
}
