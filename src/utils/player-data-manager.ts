import { Guild } from 'discord.js';
import { getPlayers, savePlayers } from './players-manager';

export interface PlayerRecord {
  userId: string;
  assignedAt: string; // ISO 8601 date string
}

export type PlayerData = PlayerRecord[];

// Obtiene todos los jugadores registrados para un guild
export async function getPlayerData(guild: Guild): Promise<PlayerData> {
  return getPlayers(guild.id);
}

// Actualiza la fecha de rango de un usuario en la DB del guild
export async function updatePlayerRankDate(
  guildId: string,
  userId: string
): Promise<void> {
  const data = await getPlayers(guildId);
  const idx = data.findIndex((r: PlayerRecord) => r.userId === userId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    data[idx].assignedAt = now;
  } else {
    data.push({ userId, assignedAt: now });
  }
  await savePlayers(guildId, data);
}

// Elimina el registro de rango de un usuario en la DB del guild
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

// Utilidad para obtener la fecha por usuario (opcional)
export async function getAssignedAtForUser(
  guildId: string,
  userId: string
): Promise<string | undefined> {
  const data = await getPlayers(guildId);
  return data.find((r: PlayerRecord) => r.userId === userId)?.assignedAt;
}
