import { GuildMember } from 'discord.js';

export interface Player {
  member: GuildMember;
  rankName: string;
  /** Indica si el miembro tiene más de un rol de rango. */
  hasMultipleRankRoles?: boolean;
}

export interface PlayerRecord {
  userId: string;
  assignedAt: string; // ISO 8601 date string
  rank: string;
  platform: string; // Plataforma del jugador (PC, PS4, X1, SWITCH)
}

export type PlayerData = PlayerRecord[];
