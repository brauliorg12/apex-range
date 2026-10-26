import { findRankRoleCandidate } from './rank-catalog';
import type { ApexRank } from '../../interfaces/apex-rank';
import type {
  RankRoleCandidateMatch,
  RankRoleDetectionResult,
} from './rank-roles-types';

/**
 * Separa los rangos faltantes entre roles candidatos existentes y rangos que
 * no tienen candidato.
 *
 * No modifica roles, configuración ni estado.
 *
 * @param existingRoleNames - Nombres de los roles existentes en el guild.
 * @param missingRanks - Rangos detectados como faltantes.
 * @param catalogRanks - Catálogo inspeccionado para excluir roles de otros rangos.
 * @returns Candidatos detectados y rangos sin candidato.
 */
export function detectRankRoleCandidates(
  existingRoleNames: readonly string[],
  missingRanks: ApexRank[],
  catalogRanks: readonly ApexRank[]
): RankRoleDetectionResult {
  const candidates: RankRoleCandidateMatch[] = [];
  const ranksToCreate: ApexRank[] = [];

  for (const rank of missingRanks) {
    const candidate = findRankRoleCandidate(
      rank,
      existingRoleNames,
      catalogRanks
    );

    if (candidate) {
      candidates.push({ rank, candidate });
    } else {
      ranksToCreate.push(rank);
    }
  }

  return { candidates, ranksToCreate };
}
