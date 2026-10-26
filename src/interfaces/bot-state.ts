export interface RolesState {
  roleCountMessageId?: string;
  roleSelectionMessageId?: string;
  channelId?: string;
  guildId?: string;
  rankCardMessageIds?: { [shortId: string]: string };
  /** Firma del catálogo de rangos usada en la última sincronización. */
  rankCatalogSignature?: string;
  /** ID del mensaje header del panel de rangos. */
  rankPanelHeaderMessageId?: string;
  /** ID del mensaje de gestión del panel de rangos. */
  rankPanelManagementMessageId?: string;
  /** Fecha ISO de la última reconstrucción del panel de rangos. */
  rankPanelUpdatedAt?: string;
  /**
   * Indica que hay una reconstrucción del panel iniciada y todavía no
   * confirmada en el estado.
   */
  rankPanelRebuildInProgress?: boolean;
  /**
   * IDs de mensajes retirados del panel que quedaron pendientes de borrado.
   * Se limpian recién cuando el borrado se confirma o el mensaje ya no existe.
   */
  rankPanelRetiredMessageIds?: string[];
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
