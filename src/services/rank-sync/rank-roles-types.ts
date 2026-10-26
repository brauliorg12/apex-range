import type { Role } from 'discord.js';
import type { ApexRank } from '../../interfaces/apex-rank';
import type { RankRoleCandidate } from './rank-catalog';

/** Fallo al crear el rol de un rango. */
export interface RankRoleFailure {
  /** Rango cuyo rol no se pudo crear. */
  rank: ApexRank;
  /** Detalle del fallo de creación. */
  error: string;
}

/** Rango faltante y rol existente candidato a adoptarlo. */
export interface RankRoleCandidateMatch {
  /** Rango que quedó faltante. */
  rank: ApexRank;
  /** Rol existente que podría corresponder al rango. */
  candidate: RankRoleCandidate;
}

/** Clasificación de los rangos faltantes según sus candidatos. */
export interface RankRoleDetectionResult {
  /** Rangos que tienen un rol existente candidato. */
  candidates: RankRoleCandidateMatch[];
  /** Rangos sin candidato que pueden crearse. */
  ranksToCreate: ApexRank[];
}

/** Resultado de aprovisionar los roles de rango faltantes. */
export interface RankRoleProvisionResult {
  /** Roles creados en el guild. */
  created: Role[];
  /** Rangos cuyo rol no se pudo crear. */
  failed: RankRoleFailure[];
  /** Rangos que no se crearon porque existe un rol candidato. */
  candidates: RankRoleCandidateMatch[];
}
