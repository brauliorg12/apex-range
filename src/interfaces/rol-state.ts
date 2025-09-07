export interface RolesState {
  roleCountMessageId?: string;
  roleSelectionMessageId?: string;
  channelId?: string;
  guildId?: string;
  rankCardMessageIds?: { [shortId: string]: string };
}
