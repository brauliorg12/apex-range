/**
 * Interfaz para la configuración de un servidor en Apex Range.
 * Incluye mapeos de rangos y roles excluidos de los cards.
 */
export interface ServerConfig {
  /** Mapeos de shortId de rango a nombre de rol personalizado */
  ranks: Record<string, string>;
  /** Lista de nombres de roles excluidos de mostrar en los cards (opcional, si vacío no excluye ninguno) */
  excludedRoles?: string[];
}
