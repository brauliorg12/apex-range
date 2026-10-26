/**
 * Rol existente que podría corresponder a un rango faltante.
 */
export interface RankSyncRoleCandidate {
  /** Etiqueta del rango que quedó faltante. */
  rankLabel: string;
  /** Nombre del rol existente que podría corresponder al rango. */
  roleName: string;
}

/**
 * Resultado notificable de una sincronización de rangos.
 */
export interface RankSyncReport {
  /** Motivo que originó la sincronización. */
  reason: string;
  /** Nombres de los roles creados durante el sync. */
  createdRoles: string[];
  /** Etiquetas de los rangos cuyos roles siguen faltando. */
  missingRoles: string[];
  /** Rangos que no se crearon porque existe un rol candidato. */
  roleCandidates: RankSyncRoleCandidate[];
  /** Indica si el panel fue reconstruido. */
  panelUpdated: boolean;
  /** Cantidad de cards del panel reconstruido. */
  cardCount: number;
  /** Avisos generados durante el sync; se resumen antes de notificar. */
  warnings: string[];
  /** Errores del sync; el detalle técnico queda en los logs. */
  errors: string[];
}
