import { GuildMember } from 'discord.js';

export interface Player {
  member: GuildMember;
  rankName: string;
}

export interface PlayerRecord {
  userId: string;
  assignedAt: string; // ISO 8601 date string
  rank: string;
  platform: string; // Plataforma del jugador (PC, PS4, X1, SWITCH)
}

export type PlayerData = PlayerRecord[];
