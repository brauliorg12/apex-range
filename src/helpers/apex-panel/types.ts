import type { EmbedBuilder } from 'discord.js';
import type { ApexStatusState } from '../../interfaces/bot-state';
import type { ServerLogger } from '../../utils/server-logger';

export type ApexEmbeds = EmbedBuilder[];
export type ApexLogger = ServerLogger;
export type StateWithGuild = ApexStatusState & { guildId: string };

export type { ApexNotifyType } from '../../interfaces/apex-notify';
