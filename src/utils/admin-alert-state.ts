import type { AdminAlertRecord } from './admin-alert-types';

/**
 * Ventana durante la cual no se repite una alerta entregada para el mismo
 * guild y archivo.
 */
const ADMIN_ALERT_THROTTLE_MS = 60 * 60 * 1000;

/**
 * Retraso corto para reintentar una alerta cuyo webhook falló.
 */
const ADMIN_ALERT_RETRY_MS = 5 * 60 * 1000;

/**
 * Estado de throttle de las alertas de infraestructura.
 */
interface AdminAlertThrottleState {
  /** Momento del último intento de emisión, en epoch milisegundos. */
  lastAttemptAt: number;
  /** Momento de la última emisión considerada entregada. */
  deliveredAt?: number;
  /** Intentos fallidos consecutivos del webhook. */
  failedAttempts: number;
  /** Indica si hay una emisión en curso para evitar duplicados. */
  inFlight: boolean;
}

/**
 * Estado previo conservado durante un intento de alerta.
 */
export interface AdminAlertAttempt {
  /** Momento de la última entrega exitosa previa, si existe. */
  deliveredAt?: number;
  /** Intentos fallidos previos del webhook. */
  failedAttempts: number;
}

const alertThrottle = new Map<string, AdminAlertThrottleState>();
let lastAdminAlert: AdminAlertRecord | null = null;

/**
 * Libera el throttle en memoria de las alertas de una guild eliminada.
 *
 * @param guildId - ID de la guild que se removió.
 */
export function forgetAdminAlerts(guildId: string): void {
  const prefix = `${guildId}:`;
  for (const key of alertThrottle.keys()) {
    if (key.startsWith(prefix)) {
      alertThrottle.delete(key);
    }
  }
}

/**
 * Devuelve la última alerta de infraestructura registrada en memoria.
 *
 * @returns Una copia de la última alerta o `null` si todavía no hubo ninguna.
 */
export function getLastAdminAlert(): AdminAlertRecord | null {
  return lastAdminAlert ? { ...lastAdminAlert } : null;
}

/**
 * Registra la última alerta de infraestructura emitida.
 *
 * @param record - Alerta emitida.
 */
export function setLastAdminAlert(record: AdminAlertRecord): void {
  lastAdminAlert = record;
}

/**
 * Describe el estado de throttle de una alerta para los logs.
 *
 * @param throttleKey - Clave de guild y archivo.
 * @returns `en-curso`, `reintento` o `entregada`.
 */
export function describeAdminAlertThrottle(throttleKey: string): string {
  const previous = alertThrottle.get(throttleKey);
  if (previous?.inFlight) return 'en-curso';
  if (previous?.failedAttempts) return 'reintento';
  return 'entregada';
}

/**
 * Indica si una alerta debe emitirse según el último intento y su entrega.
 *
 * Una emisión exitosa se recuerda durante la ventana de throttle. Un fallo
 * del webhook permite reintentar después del retraso corto. Una emisión en
 * curso bloquea duplicados concurrentes.
 *
 * @param throttleKey - Clave de guild y archivo.
 * @param now - Momento actual en epoch milisegundos.
 * @returns `true` si corresponde emitir la alerta.
 */
function shouldEmitAlert(throttleKey: string, now: number): boolean {
  const previous = alertThrottle.get(throttleKey);
  if (!previous) return true;
  if (previous.inFlight) return false;

  if (previous.failedAttempts > 0) {
    return now - previous.lastAttemptAt >= ADMIN_ALERT_RETRY_MS;
  }

  if (previous.deliveredAt === undefined) return true;
  return now - previous.deliveredAt >= ADMIN_ALERT_THROTTLE_MS;
}

/**
 * Reserva el throttle para un intento de alerta.
 *
 * Si la alerta debe emitirse, la marca en curso y devuelve el estado previo
 * necesario para completar el intento. Si está throttled, devuelve `null`.
 *
 * @param throttleKey - Clave de guild y archivo.
 * @param now - Momento actual en epoch milisegundos.
 * @returns El estado previo del intento o `null` si no corresponde emitir.
 */
export function tryBeginAdminAlertAttempt(
  throttleKey: string,
  now: number
): AdminAlertAttempt | null {
  if (!shouldEmitAlert(throttleKey, now)) return null;

  const previous = alertThrottle.get(throttleKey);
  const attempt: AdminAlertAttempt = {
    deliveredAt: previous?.deliveredAt,
    failedAttempts: previous?.failedAttempts ?? 0,
  };

  alertThrottle.set(throttleKey, {
    lastAttemptAt: now,
    deliveredAt: attempt.deliveredAt,
    failedAttempts: attempt.failedAttempts,
    inFlight: true,
  });

  return attempt;
}

/**
 * Cierra el throttle de un intento de alerta.
 *
 * Una entrega exitosa reinicia los fallos y renueva la ventana de throttle.
 * Un fallo conserva la última entrega y habilita el reintento corto.
 *
 * @param throttleKey - Clave de guild y archivo.
 * @param attempt - Estado previo devuelto por `tryBeginAdminAlertAttempt`.
 * @param delivered - Indica si la alerta se consideró entregada.
 */
export function finishAdminAlertAttempt(
  throttleKey: string,
  attempt: AdminAlertAttempt,
  delivered: boolean
): void {
  const completedAt = Date.now();

  alertThrottle.set(throttleKey, {
    lastAttemptAt: completedAt,
    deliveredAt: delivered ? completedAt : attempt.deliveredAt,
    failedAttempts: delivered ? 0 : attempt.failedAttempts + 1,
    inFlight: false,
  });
}
