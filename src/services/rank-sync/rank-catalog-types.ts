import type { ApexRank } from '../../interfaces/apex-rank';
import type { RoleMatchType } from '../../helpers/suggest-role-mapping';

/**
 * Rango con más de un rol existente que resuelve al mismo shortId.
 */
export interface AmbiguousRankRoles {
  /** Rango afectado. */
  rank: ApexRank;
  /** Nombres reales de los roles que resuelven al rango. */
  roleNames: string[];
}

/**
 * Resultado de inspeccionar el catálogo, los roles y el panel de una guild.
 */
export interface GuildRankInspection {
  /** Firma del catálogo usada en la inspección. */
  signature: string;
  /** Rangos resueltos para el guild, en el orden del catálogo. */
  ranks: ApexRank[];
  /** Rangos cuyo rol no existe en el guild. */
  missingRoles: ApexRank[];
  /** Rangos cuyo rol existe pero no tienen card registrada. */
  missingCards: ApexRank[];
  /** Claves de cards persistidas que ya no pertenecen al catálogo. */
  obsoleteCardKeys: string[];
  /** Rangos con más de un rol que resuelve al mismo shortId. */
  ambiguousRoles: AmbiguousRankRoles[];
  /** Motivos por los que el panel necesita sincronización. */
  reasons: string[];
  /** Indica si el panel debe reconstruirse. */
  needsSync: boolean;
}

/**
 * Candidato de rol existente para un rango faltante.
 */
export interface RankRoleCandidate {
  /** Nombre real del rol existente. */
  roleName: string;
  /** Origen de la coincidencia. */
  matchType: RoleMatchType;
  /** Similitud normalizada entre 0 y 1. */
  score: number;
}
