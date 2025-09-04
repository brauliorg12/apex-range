import { GuildMember } from 'discord.js';

export interface Player {
  member: GuildMember;
  rankName: string;
}

export interface PlayerRecord {
  userId: string;
  assignedAt: string; // ISO 8601 date string
}

export type PlayerData = PlayerRecord[];
