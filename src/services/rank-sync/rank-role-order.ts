import type { Guild, Role } from 'discord.js';
import type { ApexRank } from '../../interfaces/apex-rank';
import { sortRanksByTier } from '../../helpers/rank-priority';
import { getServerLogger } from '../../utils/server-logger';
import { normalizeRoleName } from './rank-catalog';

/**
 * Acomoda los roles de rango debajo del rol más alto del bot y en el orden
 * visual de `tier`: Predator arriba y Hierro abajo.
 *
 * Usa una única llamada a `setPositions`. Si falla, registra el error y
 * conserva los roles ya creados; no modifica nombres, permisos ni
 * `mentionable`.
 *
 * @param guild - Guild donde se acomodan los roles.
 * @param catalogRanks - Catálogo de rangos del guild.
 * @param botHighestRoleId - ID del rol más alto del bot.
 */
export async function applyRankRoleOrder(
  guild: Guild,
  catalogRanks: readonly ApexRank[],
  botHighestRoleId: string
): Promise<void> {
  try {
    const botHighestRole = await guild.roles.fetch(botHighestRoleId, {
      force: true,
    });
    if (!botHighestRole) {
      throw new Error('No se pudo leer el rol más alto del bot.');
    }

    const rolesByName = new Map(
      guild.roles.cache.map((role) => [normalizeRoleName(role.name), role])
    );
    const sortedRanks = sortRanksByTier(catalogRanks);
    const positions: { role: Role; position: number }[] = [];
    let nextPosition = botHighestRole.position - 1;

    for (let index = sortedRanks.length - 1; index >= 0; index--) {
      if (nextPosition < 1) break;

      const role = rolesByName.get(
        normalizeRoleName(sortedRanks[index].roleName)
      );
      if (!role) continue;

      positions.push({ role, position: nextPosition });
      nextPosition--;
    }

    if (positions.length > 0) {
      await guild.roles.setPositions(positions);
    }
  } catch (error) {
    getServerLogger(guild.id, guild.name).warn(
      `[rank-sync] No se pudieron ordenar los roles de rango: ` +
        (error instanceof Error ? error.message : String(error))
    );
  }
}
