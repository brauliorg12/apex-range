/**
 * Tipos de evento notificables del panel de Apex.
 * Se comparte entre el notificador y el flujo de recuperacion.
 */
export type ApexNotifyType =
  | 'missing_permissions'
  | 'message_not_found'
  | 'panel_recreated'
  | 'recovery_suspended'
  | 'channel_not_found'
  | 'unknown';
