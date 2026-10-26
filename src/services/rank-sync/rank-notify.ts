/**
 * Barrel mínimo de las notificaciones del rank sync.
 *
 * Mantiene los exports históricos de `rank-notify.ts` mientras la
 * implementación vive en módulos separados por responsabilidad.
 */
export type {
  RankSyncReport,
  RankSyncRoleCandidate,
} from './rank-notify-types';
export { forgetRankSyncNotifications } from './rank-notify-fingerprint';
export { notifyRankSync } from './rank-notify-delivery';
