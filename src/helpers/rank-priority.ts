import type { ApexRank } from '../interfaces/apex-rank';

/**
 * Rol mínimo necesario para resolver un rango.
 */
export interface RankRoleLike {
  /** Nombre del rol de Discord. */
  name: string;
}

/**
 * Resuelve nombres de rol a rangos y elige el de mayor jerarquía.
 */
export interface RankResolver {
  /**
   * Resuelve un nombre de rol al rango correspondiente.
   *
   * @param roleName - Nombre del rol.
   * @returns El rango o `undefined` si el rol no pertenece al catálogo.
   */
  resolveRole(roleName: string): ApexRank | undefined;
  /**
   * Devuelve el rango de mayor jerarquía entre los roles dados.
   *
   * @param roles - Roles del miembro.
   * @returns El rango más alto o `undefined` si no hay roles de rango.
   */
  pickHighest(roles: Iterable<RankRoleLike>): ApexRank | undefined;
}

/**
 * Ordena una copia del catálogo por `tier` ascendente.
 *
 * @param ranks - Catálogo de rangos.
 * @returns Un array nuevo ordenado de menor a mayor tier.
 */
export function sortRanksByTier(ranks: readonly ApexRank[]): ApexRank[] {
  return [...ranks].sort((a, b) => a.tier - b.tier);
}

/**
 * Construye un resolvedor para un catálogo de rangos resuelto.
 *
 * La jerarquía se decide por el `tier` de cada rango, no por `role.position`
 * ni por el orden del caché de Discord.
 *
 * @param ranks - Catálogo de rangos del guild.
 * @returns El resolvedor listo para usar.
 */
export function buildRankResolver(ranks: readonly ApexRank[]): RankResolver {
  const rankByRoleName = new Map<string, ApexRank>();
  for (const rank of ranks) {
    rankByRoleName.set(rank.roleName, rank);
  }

  return {
    resolveRole(roleName) {
      return rankByRoleName.get(roleName);
    },
    pickHighest(roles) {
      let highest: ApexRank | undefined;
      let highestTier = 0;

      for (const role of roles) {
        const rank = rankByRoleName.get(role.name);
        if (!rank || rank.tier <= highestTier) continue;

        highest = rank;
        highestTier = rank.tier;
      }

      return highest;
    },
  };
}

/**
 * Elige el rango de mayor jerarquía entre los roles dados.
 *
 * Construye un resolvedor para la consulta puntual. Para varios miembros,
 * reutilizar `buildRankResolver` una vez por guild.
 *
 * @param ranks - Catálogo de rangos del guild.
 * @param roles - Roles del miembro.
 * @returns El rango más alto o `undefined` si no hay roles de rango.
 */
export function pickHighestRank(
  ranks: readonly ApexRank[],
  roles: Iterable<RankRoleLike>
): ApexRank | undefined {
  return buildRankResolver(ranks).pickHighest(roles);
}
