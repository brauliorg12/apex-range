import { getApexRanksForGuild } from './get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from './get-apex-platforms-for-guild';
import { ROLE_ALIASES } from '../models/constants-roles';

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
 * Calcula similitud entre dos strings (0-1)
 * Ahora con soporte para aliases conocidos
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // Match exacto
  if (s1 === s2) return 1.0;

  // Verificar si son aliases conocidos (coincidencia perfecta)
  if (areAliases(str1, str2)) return 1.0;

  // Contiene uno al otro
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;

  // Levenshtein distance
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
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
  const SIMILARITY_THRESHOLD = 0.7; // 70% de similitud mínima

  for (const item of allItems) {
    let bestMatch = '';
    let bestScore = 0;

    // Intentar con label, roleName y shortId
    const searchTerms = [item.label, item.roleName, item.shortId];

    for (const roleName of existingRoles) {
      for (const term of searchTerms) {
        const score = stringSimilarity(term, roleName);

        if (score > bestScore && score >= SIMILARITY_THRESHOLD) {
          bestScore = score;
          bestMatch = roleName;
        }
      }
    }

    if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
      suggestions[item.shortId] = bestMatch;
    }
  }

  return suggestions;
}
