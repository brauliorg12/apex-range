import { Guild, Role } from 'discord.js';
import type { GuildMember } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { buildRankResolver } from '../helpers/rank-priority';
import type { RankResolver } from '../helpers/rank-priority';

/**
 * Estados de presencia considerados al ordenar miembros.
 */
type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

/**
 * Ordena los miembros por prioridad para mostrar en los paneles:
 * - Estado de presencia: primero online, luego inactivos (idle), luego dnd,
 *   luego offline/invisible.
 * - Si el estado es igual, prioriza por fecha de asignación del rango
 *   (más reciente primero).
 * - Los miembros sin datos de presencia quedan al final.
 *
 * @param members - Array de miembros del servidor.
 * @param playerData - Array de datos de jugadores con fecha de asignación.
 * @returns Array de miembros ordenados por prioridad.
 */
export function sortMembersByPriority(members: any[], playerData: any[]) {
  const assignedMap = new Map<string, Date>();
  playerData.forEach((p: any) => {
    assignedMap.set(p.userId, new Date(p.assignedAt));
  });

  const statusOrder: Record<PresenceStatus, number> = {
    online: 0,
    idle: 1,
    dnd: 2,
    offline: 3,
    invisible: 4,
  };

  return [...members].sort((a, b) => {
    if (!a.presence && b.presence) return 1;
    if (a.presence && !b.presence) return -1;
    if (!a.presence && !b.presence) return 0;

    const aStatus =
      statusOrder[(a.presence?.status ?? 'offline') as PresenceStatus];
    const bStatus =
      statusOrder[(b.presence?.status ?? 'offline') as PresenceStatus];
    if (aStatus !== bStatus) return aStatus - bStatus;

    const aAssigned = assignedMap.get(a.id)?.getTime() ?? 0;
    const bAssigned = assignedMap.get(b.id)?.getTime() ?? 0;
    return bAssigned - aAssigned;
  });
}

/**
 * Obtiene todos los miembros del rango, incluyendo desconectados, usando el
 * caché de Discord.
 *
 * Verifica directamente si el miembro tiene el rol asignado en Discord.
 *
 * @param guild - El guild de Discord.
 * @param role - El rol de rango a buscar.
 * @param playerData - Datos de jugadores sincronizados; se usan sus IDs.
 * @param resolver - Resolvedor reutilizable; si se omite, se construye para
 *   el guild.
 * @returns Miembros en caché cuyo rango más alto es el rol indicado.
 */
export function getAllMembersByRole(
  guild: Guild,
  role: Role,
  playerData: any[],
  resolver?: RankResolver
) {
  const rankResolver =
    resolver ?? buildRankResolver(getApexRanksForGuild(guild.id, guild));
  const members: GuildMember[] = [];

  for (const player of playerData) {
    const member = guild.members.cache.get(player.userId);
    if (!member || !member.roles.cache.has(role.id)) continue;

    const highest = rankResolver.pickHighest(member.roles.cache.values());
    if (highest?.roleName === role.name) {
      members.push(member);
    }
  }

  return members;
}

/**
 * Obtiene todos los miembros de un rol de rango, incluyendo proxies para
 * usuarios fuera de caché.
 *
 * Esta función es para el botón "Ver más" en servidores grandes (4000+).
 * Soporta AMBOS formatos: shortId ("gold") y nombres mapeados ("Oro").
 * Para miembros en caché usa el rango más alto real; para proxies usa el
 * rango persistido en `playerData`.
 *
 * @param guild - El guild de Discord.
 * @param role - El rol de rango a buscar.
 * @param playerData - Datos de jugadores sincronizados.
 * @param resolver - Resolvedor reutilizable; si se omite, se construye para
 *   el guild.
 * @returns Miembros en caché o proxies para los que no están cacheados.
 */
export function getAllMembersByRoleWithProxies(
  guild: Guild,
  role: Role,
  playerData: any[],
  resolver?: RankResolver
) {
  const rankResolver =
    resolver ?? buildRankResolver(getApexRanksForGuild(guild.id, guild));
  const rank = rankResolver.resolveRole(role.name);
  const rankShortId = rank ? rank.shortId : null;
  const members: any[] = [];

  for (const player of playerData) {
    const cached = guild.members.cache.get(player.userId);

    if (cached) {
      const highest = rankResolver.pickHighest(cached.roles.cache.values());
      const belongsToRole = highest
        ? highest.roleName === role.name
        : player.rank === rankShortId || player.rank === role.name;

      if (belongsToRole) {
        members.push(cached);
      }
      continue;
    }

    if (player.rank !== rankShortId && player.rank !== role.name) {
      continue;
    }

    members.push({
      id: player.userId,
      user: {
        id: player.userId,
        username: 'Usuario',
        discriminator: '0000',
      },
      displayName: 'Usuario',
      presence: null,
      roles: { cache: new Map([[role.id, role]]) },
      guild,
    } as any);
  }

  return members;
}
