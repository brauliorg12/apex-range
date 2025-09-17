import { getApexRanksForGuild } from './get-apex-ranks-for-guild';

/**
 * Sugiere mapeos de roles basados en roles existentes en el servidor.
 * @param guildId ID del servidor.
 * @param existingRoles Lista de roles existentes.
 * @returns Objeto con sugerencias de mapeo { shortId: roleNameExistente }.
 */
export function suggestRoleMappings(
  guildId: string,
  existingRoles: string[]
): Record<string, string> {
  const suggestions: Record<string, string> = {};
  const ranks = getApexRanksForGuild(guildId); // Sin guild para sugerencias iniciales

  for (const rank of ranks) {
    const normalizedShortId = rank.shortId
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const normalizedLabel = rank.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const roleName of existingRoles) {
      const normalizedRole = roleName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (
        normalizedRole.includes(normalizedShortId) ||
        normalizedRole.includes(normalizedLabel)
      ) {
        suggestions[rank.shortId] = roleName;
        break; // Solo una sugerencia por rango
      }
    }
  }

  return suggestions;
}
