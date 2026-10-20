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
  /** Intentos de recuperacion automatica del panel desde el ultimo exito. */
  recoveryAttempts?: number;
  /** Timestamp del ultimo intento de recuperacion. */
  lastRecoveryAt?: number;
  /** Si esta definido, no se intenta recuperar hasta ese timestamp. */
  recoverySuspendedUntil?: number;
}

export interface BotControlState {
  controlChannelId?: string;
  guildId?: string;
}
