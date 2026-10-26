import { getApexRanksForGuild } from './get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from './get-apex-platforms-for-guild';
import { ROLE_ALIASES } from '../models/constants-roles';

/**
 * Umbral mínimo de similitud para considerar un rol como candidato.
 * Se comparte entre `suggestRoleMappings` y `findBestRoleMatch`.
 */
export const SIMILARITY_THRESHOLD = 0.7;

/**
 * Origen de una coincidencia entre un término y un rol existente.
 */
export type RoleMatchType = 'exact' | 'alias' | 'similar';

/**
 * Coincidencia entre los términos de un rango y un rol existente.
 */
export interface RoleMatch {
  /** Nombre real del rol existente. */
  roleName: string;
  /** Similitud normalizada entre 0 y 1. */
  score: number;
  /** Origen de la coincidencia. */
  matchType: RoleMatchType;
}

/**
 * Prioridad de los tipos de coincidencia para desempatar.
 */
const MATCH_TYPE_PRIORITY: Record<RoleMatchType, number> = {
  exact: 3,
  alias: 2,
  similar: 1,
};

/**
 * Verifica si dos términos son aliases conocidos
 */
function areAliases(term1: string, term2: string): boolean {
  const normalized1 = normalizeText(term1);
  const normalized2 = normalizeText(term2);

  for (const [key, aliases] of Object.entries(ROLE_ALIASES)) {
    const allTerms = [key, ...aliases].map(normalizeText);

    if (allTerms.includes(normalized1) && allTerms.includes(normalized2)) {
      return true;
    }
  }

  return false;
}

/**
 * Normaliza texto para comparación (sin acentos, minúsculas, sin espacios extras)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '') // Solo alfanuméricos
    .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calcula la similitud entre dos textos ya normalizados.
 *
 * @param normalizedA - Primer texto normalizado.
 * @param normalizedB - Segundo texto normalizado.
 * @returns Similitud entre 0 y 1.
 */
function calculateNormalizedSimilarity(
  normalizedA: string,
  normalizedB: string
): number {
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    return 0.9;
  }

  const longer =
    normalizedA.length > normalizedB.length ? normalizedA : normalizedB;
  const shorter =
    normalizedA.length > normalizedB.length ? normalizedB : normalizedA;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Compara un término con un rol existente y devuelve la mejor coincidencia.
 *
 * @param term - Término esperado (label, roleName o shortId).
 * @param roleName - Nombre real del rol existente.
 * @returns La coincidencia o `null` si no alcanza el umbral.
 */
function matchTermToRole(term: string, roleName: string): RoleMatch | null {
  const normalizedTerm = normalizeText(term);
  const normalizedRole = normalizeText(roleName);

  if (normalizedTerm === normalizedRole) {
    return { roleName, score: 1, matchType: 'exact' };
  }

  if (areAliases(term, roleName)) {
    return { roleName, score: 1, matchType: 'alias' };
  }

  const score = calculateNormalizedSimilarity(normalizedTerm, normalizedRole);
  if (score < SIMILARITY_THRESHOLD) return null;

  return { roleName, score, matchType: 'similar' };
}

/**
 * Indica si una coincidencia debe reemplazar a la mejor actual.
 *
 * Desempata por tipo (exacto > alias > similar) y luego por nombre
 * normalizado alfabéticamente para que el resultado sea determinístico.
 *
 * @param candidate - Coincidencia candidata.
 * @param current - Mejor coincidencia actual.
 * @returns `true` si `candidate` es mejor que `current`.
 */
function isBetterMatch(candidate: RoleMatch, current: RoleMatch): boolean {
  if (candidate.score !== current.score) {
    return candidate.score > current.score;
  }

  const candidatePriority = MATCH_TYPE_PRIORITY[candidate.matchType];
  const currentPriority = MATCH_TYPE_PRIORITY[current.matchType];
  if (candidatePriority !== currentPriority) {
    return candidatePriority > currentPriority;
  }

  return (
    normalizeText(candidate.roleName) < normalizeText(current.roleName)
  );
}

/**
 * Busca la mejor coincidencia entre varios términos y un rol existente.
 *
 * @param terms - Términos esperados del rango.
 * @param roleName - Nombre real del rol existente.
 * @returns La mejor coincidencia o `null` si no alcanza el umbral.
 */
function findBestTermMatch(
  terms: readonly string[],
  roleName: string
): RoleMatch | null {
  let best: RoleMatch | null = null;

  for (const term of terms) {
    const match = matchTermToRole(term, roleName);
    if (!match) continue;
    if (!best || isBetterMatch(match, best)) {
      best = match;
    }
  }

  return best;
}

/**
 * Busca el rol existente más parecido a un conjunto de términos.
 *
 * Usa la misma normalización, aliases y umbral que `suggestRoleMappings`.
 * Ante un empate, prioriza exacto > alias > similar y luego el nombre
 * normalizado alfabéticamente. Un empate devuelve un candidato, nunca
 * `null`, para que el flujo no lo interprete como ausencia de rol y cree
 * un duplicado.
 *
 * @param terms - Términos esperados del rango (label, roleName, shortId).
 * @param existingRoles - Nombres de los roles existentes en el guild.
 * @returns La mejor coincidencia o `null` si ningún rol alcanza el umbral.
 */
export function findBestRoleMatch(
  terms: readonly string[],
  existingRoles: readonly string[]
): RoleMatch | null {
  let best: RoleMatch | null = null;

  for (const roleName of existingRoles) {
    const match = findBestTermMatch(terms, roleName);
    if (!match) continue;
    if (!best || isBetterMatch(match, best)) {
      best = match;
    }
  }

  return best;
}

/**
 * Sugiere mapeos de roles basados en roles existentes en el servidor.
 * Usa algoritmo de similitud mejorado con Levenshtein distance.
 * @param guildId ID del servidor.
 * @param existingRoles Lista de roles existentes.
 * @returns Objeto con sugerencias de mapeo { shortId: roleNameExistente }.
 */
export function suggestRoleMappings(
  guildId: string,
  existingRoles: string[]
): Record<string, string> {
  const suggestions: Record<string, string> = {};
  const ranks = getApexRanksForGuild(guildId);
  const platforms = getApexPlatformsForGuild(guildId);

  const allItems = [...ranks, ...platforms];

  for (const item of allItems) {
    const match = findBestRoleMatch(
      [item.label, item.roleName, item.shortId],
      existingRoles
    );

    if (match) {
      suggestions[item.shortId] = match.roleName;
    }
  }

  return suggestions;
}
