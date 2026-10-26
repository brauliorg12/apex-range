/**
 * Barrel del catálogo de rangos.
 *
 * Mantiene los exports históricos de `rank-catalog.ts` mientras la
 * implementación vive en módulos separados por responsabilidad.
 */
export type {
  AmbiguousRankRoles,
  GuildRankInspection,
  RankRoleCandidate,
} from './rank-catalog-types';
export {
  getRankCatalogSignature,
  normalizeRoleName,
} from './rank-catalog-signature';
export { inspectGuildRanks } from './rank-catalog-inspection';
export { findRankRoleCandidate } from './rank-catalog-candidates';
