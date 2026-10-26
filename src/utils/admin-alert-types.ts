/**
 * Tipos de fallo de infraestructura que puede reportar una alerta.
 */
export type AdminAlertErrorType = 'invalid' | 'io-error';

/**
 * Datos necesarios para emitir una alerta de infraestructura.
 */
export interface AdminAlertInput {
  /** ID de la guild afectada. */
  guildId: string;
  /** Nombre de la guild afectada, si está disponible. */
  guildName?: string;
  /** Ruta lógica del archivo con problemas, relativa al proyecto. */
  file: string;
  /** Tipo de fallo detectado. */
  errorType: AdminAlertErrorType;
  /** Acción sugerida para el administrador de la app. */
  suggestedAction: string;
  /** Indica si el panel anterior quedó intacto. */
  panelIntact: boolean;
}

/**
 * Datos mínimos para alertar por un `.bot-state` corrupto o ilegible.
 */
export interface CorruptStateAlertInput {
  /** ID de la guild afectada. */
  guildId: string;
  /** Nombre de la guild afectada, si está disponible. */
  guildName?: string;
  /** Tipo de fallo detectado al leer el archivo de estado. */
  errorType: AdminAlertErrorType;
  /**
   * Indica si el panel anterior quedó intacto. Si se omite, se asume que sí.
   */
  panelIntact?: boolean;
}

/**
 * Última alerta registrada en memoria para diagnóstico.
 */
export interface AdminAlertRecord extends AdminAlertInput {
  /** Momento de emisión en formato ISO 8601. */
  emittedAt: string;
  /** Indica si el webhook aceptó el resumen. */
  webhookDelivered: boolean;
}

/**
 * Resultado del envío de una alerta al webhook de administración.
 */
export type AdminWebhookResult = 'delivered' | 'failed' | 'not-configured';
