import { createHash } from 'crypto';
import type { RankSyncReport } from './rank-notify-types';

// #region Estado

/**
 * Ventana durante la cual un reporte con la misma huella no se vuelve a
 * notificar después de una entrega exitosa.
 */
const NOTIFY_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

/**
 * Retraso base para reintentar una notificación cuya entrega falló.
 */
const NOTIFY_RETRY_BASE_MS = 60 * 1000;

/**
 * Retraso máximo del backoff de reintentos.
 */
const NOTIFY_RETRY_MAX_MS = 5 * 60 * 1000;

/**
 * Estado de entrega de la última notificación de una guild.
 */
interface RankSyncNotificationState {
  /** Huella estable del reporte. */
  fingerprint: string;
  /** Momento del último intento de entrega, en epoch milisegundos. */
  lastAttemptAt: number;
  /** Momento de la última entrega exitosa, si existe. */
  deliveredAt?: number;
  /** Intentos fallidos consecutivos para la huella actual. */
  failedAttempts: number;
}

const notificationState = new Map<string, RankSyncNotificationState>();

/**
 * Libera la huella, el estado de entrega y el backoff de notificación en
 * memoria de una guild eliminada.
 *
 * @param guildId - ID de la guild que se removió.
 */
export function forgetRankSyncNotifications(guildId: string): void {
  notificationState.delete(guildId);
}

// #endregion

// #region Reporte

/**
 * Indica si el reporte contiene algo que justifique una notificación.
 *
 * @param report - Reporte del rank sync.
 * @returns `true` si hay roles, avisos o errores para reportar.
 */
export function hasNotifiableChanges(report: RankSyncReport): boolean {
  return (
    report.createdRoles.length > 0 ||
    report.missingRoles.length > 0 ||
    report.roleCandidates.length > 0 ||
    report.warnings.length > 0 ||
    report.errors.length > 0
  );
}

/**
 * Ordena y deduplica valores para que el mismo conjunto produzca siempre la
 * misma huella, sin importar el orden en que se generó.
 *
 * @param values - Valores a normalizar.
 * @returns Los valores únicos en orden estable.
 */
function normalizeFingerprintValues(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

/**
 * Construye una huella estable del contenido notificable de un reporte.
 *
 * Incluye roles creados, faltantes, candidatos, avisos y errores ordenados.
 * El destino y los datos de panel no forman parte de la huella.
 *
 * @param report - Reporte del rank sync.
 * @returns La huella serializada del reporte.
 */
export function buildReportFingerprint(report: RankSyncReport): string {
  const candidateKeys = report.roleCandidates.map(
    (candidate) => `${candidate.rankLabel}\u0000${candidate.roleName}`
  );

  return JSON.stringify({
    createdRoles: normalizeFingerprintValues(report.createdRoles),
    missingRoles: normalizeFingerprintValues(report.missingRoles),
    roleCandidates: normalizeFingerprintValues(candidateKeys),
    warnings: normalizeFingerprintValues(report.warnings),
    errors: normalizeFingerprintValues(report.errors),
  });
}

/**
 * Abrevia una huella en un hash corto para identificarla en los logs sin
 * ocupar una línea completa.
 *
 * @param fingerprint - Huella completa del reporte.
 * @returns Los primeros ocho caracteres hexadecimales del hash.
 */
export function shortenFingerprint(fingerprint: string): string {
  return createHash('sha1').update(fingerprint).digest('hex').slice(0, 8);
}

/**
 * Calcula el retraso del próximo reintento según los intentos fallidos.
 *
 * @param failedAttempts - Cantidad de intentos fallidos consecutivos.
 * @returns El retraso en milisegundos, acotado por el máximo configurado.
 */
export function getRetryDelayMs(failedAttempts: number): number {
  const exponent = Math.max(0, failedAttempts - 1);
  return Math.min(
    NOTIFY_RETRY_BASE_MS * 2 ** exponent,
    NOTIFY_RETRY_MAX_MS
  );
}

/**
 * Decide si un reporte debe notificarse según su huella y el estado de
 * entrega.
 *
 * Un reporte nuevo o con huella distinta se notifica de inmediato. Si la
 * huella no cambió, la ventana de deduplicación solo aplica después de una
 * entrega exitosa. Tras un fallo se permite un reintento con backoff corto.
 *
 * @param guildId - ID de la guild.
 * @param fingerprint - Huella del reporte actual.
 * @param now - Momento actual en epoch milisegundos.
 * @returns `true` si corresponde notificar.
 */
export function shouldNotify(
  guildId: string,
  fingerprint: string,
  now: number
): boolean {
  const previous = notificationState.get(guildId);
  if (!previous) return true;
  if (previous.fingerprint !== fingerprint) return true;

  if (previous.failedAttempts > 0) {
    return (
      now - previous.lastAttemptAt >= getRetryDelayMs(previous.failedAttempts)
    );
  }

  if (previous.deliveredAt === undefined) return true;
  return now - previous.deliveredAt >= NOTIFY_DEDUPE_WINDOW_MS;
}

/**
 * Registra una entrega exitosa y reinicia el backoff de la huella.
 *
 * @param guildId - ID de la guild.
 * @param fingerprint - Huella entregada.
 */
export function markNotificationDelivered(
  guildId: string,
  fingerprint: string
): void {
  const deliveredAt = Date.now();
  notificationState.set(guildId, {
    fingerprint,
    lastAttemptAt: deliveredAt,
    deliveredAt,
    failedAttempts: 0,
  });
}

/**
 * Registra un intento fallido sin marcar la huella como entregada.
 *
 * Conserva la última entrega exitosa para que la deduplicación siga siendo
 * coherente si el reporte vuelve a coincidir.
 *
 * @param guildId - ID de la guild.
 * @param fingerprint - Huella que no se pudo entregar.
 * @returns La cantidad de intentos fallidos consecutivos.
 */
export function markNotificationFailed(
  guildId: string,
  fingerprint: string
): number {
  const previous = notificationState.get(guildId);
  const sameFingerprint = previous?.fingerprint === fingerprint;
  const failedAttempts =
    previous && previous.fingerprint === fingerprint
      ? previous.failedAttempts + 1
      : 1;

  notificationState.set(guildId, {
    fingerprint,
    lastAttemptAt: Date.now(),
    deliveredAt: sameFingerprint ? previous?.deliveredAt : undefined,
    failedAttempts,
  });

  return failedAttempts;
}

// #endregion
