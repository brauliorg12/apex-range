import type { ApexRank } from '../../interfaces/apex-rank';
import { COMMON_APEX_ROLE_NAME } from '../../models/constants';
import { findBestRoleMatch } from '../../helpers/suggest-role-mapping';
import { normalizeRoleName } from './rank-catalog-signature';
import type { RankRoleCandidate } from './rank-catalog-types';

/**
 * Indica si un rol corresponde al rol común que no representa un rango.
 *
 * @param roleName - Nombre real del rol existente.
 * @returns `true` si el rol es el rol común `Apex`.
 */
function isCommonRoleName(roleName: string): boolean {
  return (
    normalizeRoleName(roleName) === normalizeRoleName(COMMON_APEX_ROLE_NAME)
  );
}

/**
 * Indica si un rol existente coincide de forma exacta o por alias con otro
 * rango del catálogo.
 *
 * @param roleName - Nombre real del rol existente.
 * @param rank - Rango que se está detectando.
 * @param catalogRanks - Catálogo completo de rangos inspeccionado.
 * @returns `true` si el rol pertenece a otro rango.
 */
function belongsToAnotherRank(
  roleName: string,
  rank: ApexRank,
  catalogRanks: readonly ApexRank[]
): boolean {
  return catalogRanks.some((otherRank) => {
    if (otherRank.shortId === rank.shortId) return false;

    const match = findBestRoleMatch(
      [otherRank.label, otherRank.roleName, otherRank.shortId],
      [roleName]
    );

    return match?.matchType === 'exact' || match?.matchType === 'alias';
  });
}

/**
 * Busca un rol existente que podría corresponder a un rango faltante.
 *
 * No modifica roles, configuración ni estado. Comparte el umbral y la
 * normalización de `suggestRoleMappings`.
 *
 * Ignora el rol común `Apex` y los roles que coinciden de forma exacta o por
 * alias con otro rango, para no confundir rangos entre sí (por ejemplo,
 * `Maestro` con `Gran maestro`).
 *
 * Ante un empate en el mejor puntaje, prioriza la coincidencia exacta sobre
 * el alias y el alias sobre la similitud. Si persiste el empate, usa el nombre
 * normalizado alfabéticamente. Un empate nunca devuelve `null`: un candidato
 * detectado debe reportarse en lugar de crear un rol nuevo.
 *
 * @param rank - Rango cuyo rol falta.
 * @param existingRoleNames - Nombres de los roles existentes en el guild.
 * @param catalogRanks - Catálogo completo de rangos del guild.
 * @returns El candidato o `null` si ningún rol alcanza el umbral.
 */
export function findRankRoleCandidate(
  rank: ApexRank,
  existingRoleNames: readonly string[],
  catalogRanks: readonly ApexRank[]
): RankRoleCandidate | null {
  const candidateNames = existingRoleNames.filter(
    (roleName) =>
      !isCommonRoleName(roleName) &&
      !belongsToAnotherRank(roleName, rank, catalogRanks)
  );

  const match = findBestRoleMatch(
    [rank.label, rank.roleName, rank.shortId],
    candidateNames
  );

  if (!match) return null;

  return {
    roleName: match.roleName,
    matchType: match.matchType,
    score: match.score,
  };
}
