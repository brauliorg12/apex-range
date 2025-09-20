export interface RolesState {
  roleCountMessageId?: string;
  roleSelectionMessageId?: string;
  channelId?: string;
  guildId?: string;
  rankCardMessageIds?: { [shortId: string]: string };
}

export interface ApexStatusState {
  apexInfoMessageId?: string;
  channelId?: string;
  guildId?: string;
}

export interface BotControlState {
  controlChannelId?: string;
  guildId?: string;
}
