import { Guild } from 'discord.js';
import type { GuildMember, Role } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import type { RankResolver } from '../helpers/rank-priority';
import type { ApexRank } from '../interfaces/apex-rank';
import type { PlayerRecord } from '../interfaces/player';

/**
 * Índice de miembros agrupados por el nombre de rol de su rango de mayor tier.
 */
export interface RankMemberIndex {
  /** Miembros en caché agrupados por rol de su rango más alto. */
  cachedByRank: Map<string, GuildMember[]>;
  /** Miembros y proxies agrupados por rol cuando se solicitaron proxies. */
  withProxiesByRank?: Map<string, GuildMember[]>;
}

/**
 * Opciones para construir el índice de miembros por rango.
 */
export interface RankMemberIndexOptions {
  /** Incluye proxies para usuarios fuera de caché y cacheados sin rango. */
  includeProxies?: boolean;
  /** Catálogo resuelto; si se omite, se resuelve para el guild. */
  ranks?: readonly ApexRank[];
}

/**
 * Agrega un miembro a la lista de su rango, creando la lista si no existe.
 *
 * @param membersByRank - Índice de listas por nombre de rol.
 * @param rankName - Nombre del rol de rango.
 * @param member - Miembro o proxy a agregar.
 */
function addMemberToRank(
  membersByRank: Map<string, GuildMember[]>,
  rankName: string,
  member: GuildMember
): void {
  const current = membersByRank.get(rankName);
  if (current) {
    current.push(member);
  } else {
    membersByRank.set(rankName, [member]);
  }
}

/**
 * Construye el proxy liviano con la misma forma que usaba "Ver más".
 *
 * @param player - Registro persistido del jugador.
 * @param role - Rol de rango del guild.
 * @param guild - Guild al que pertenece el proxy.
 * @returns El proxy compatible con el render de miembros.
 */
function buildProxyMember(
  player: PlayerRecord,
  role: Role,
  guild: Guild
): GuildMember {
  return {
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
  } as unknown as GuildMember;
}

/**
 * Construye el índice de miembros por rango en una sola pasada.
 *
 * Recorre `playerData` en su orden original. Para miembros en caché usa el
 * rango real de mayor `tier`. En modo con proxies, un miembro cacheado sin
 * rango o un usuario fuera de caché se resuelve con `player.rank` contra el
 * shortId o el nombre del rol. En modo sin proxies, solo aparecen miembros
 * cacheados con un rol de rango real.
 *
 * @param guild - Guild del que se leen miembros y roles.
 * @param playerData - Registros persistidos en su orden original.
 * @param resolver - Resolvedor canónico del catálogo del guild.
 * @param options - Modo de proxies y catálogo ya resuelto.
 * @returns El índice con los miembros agrupados por nombre de rol.
 */
export function buildRankMemberIndex(
  guild: Guild,
  playerData: readonly PlayerRecord[],
  resolver: RankResolver,
  options: RankMemberIndexOptions = {}
): RankMemberIndex {
  const cachedByRank = new Map<string, GuildMember[]>();
  const includeProxies = options.includeProxies === true;
  const withProxiesByRank = includeProxies
    ? new Map<string, GuildMember[]>()
    : undefined;
  const ranks = includeProxies
    ? options.ranks ?? getApexRanksForGuild(guild.id, guild)
    : [];
  const rankByShortId = new Map<string, ApexRank>();
  const roleByRankName = new Map<string, Role>();

  for (const rank of ranks) {
    rankByShortId.set(rank.shortId, rank);
  }

  if (includeProxies) {
    for (const role of guild.roles.cache.values()) {
      if (!roleByRankName.has(role.name)) {
        roleByRankName.set(role.name, role);
      }
    }
  }

  const resolvePlayerRank = (value: string): ApexRank | undefined => {
    if (!value) return undefined;
    return rankByShortId.get(value) ?? resolver.resolveRole(value);
  };

  for (const player of playerData) {
    const cached = guild.members.cache.get(player.userId);

    if (cached) {
      const highest = resolver.pickHighest(cached.roles.cache.values());
      if (highest) {
        addMemberToRank(cachedByRank, highest.roleName, cached);
        if (withProxiesByRank) {
          addMemberToRank(withProxiesByRank, highest.roleName, cached);
        }
        continue;
      }

      if (withProxiesByRank) {
        const persistedRank = resolvePlayerRank(player.rank);
        if (persistedRank) {
          addMemberToRank(
            withProxiesByRank,
            persistedRank.roleName,
            cached
          );
        }
      }
      continue;
    }

    if (!withProxiesByRank) continue;

    const persistedRank = resolvePlayerRank(player.rank);
    if (!persistedRank) continue;

    const role = roleByRankName.get(persistedRank.roleName);
    if (!role) continue;

    addMemberToRank(
      withProxiesByRank,
      persistedRank.roleName,
      buildProxyMember(player, role, guild)
    );
  }

  return { cachedByRank, withProxiesByRank };
}
