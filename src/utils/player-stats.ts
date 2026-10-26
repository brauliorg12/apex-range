import { Guild, Role } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getPlayerDataSnapshot } from './player-data-manager';
import { getServerLogger } from './server-logger';

/**
 * Datos del catálogo activo usados por las estadísticas.
 */
interface ActiveRankContext {
  /** Nombres de roles de rango activos. */
  roleNames: Set<string>;
  /** shortIds y nombres de rol para leer datos históricos. */
  keys: Set<string>;
}

/**
 * Construye el contexto de rangos activos con una sola lectura del catálogo.
 *
 * @param guild - Servidor de Discord.
 * @returns Nombres de rol y claves de rango activas.
 */
function getActiveRankContext(guild: Guild): ActiveRankContext {
  const roleNames = new Set<string>();
  const keys = new Set<string>();

  for (const rank of getApexRanksForGuild(guild.id, guild)) {
    roleNames.add(rank.roleName);
    keys.add(rank.shortId);
    keys.add(rank.roleName);
  }

  return { roleNames, keys };
}

/**
 * Cuenta jugadores registrados con un rango activo.
 *
 * @param players - Registros deserializados de `players_*.json`.
 * @param activeRankKeys - shortIds y nombres de rol activos.
 * @returns Cantidad de registros con rango activo.
 */
function countRegisteredRankedPlayers(
  players: readonly unknown[],
  activeRankKeys: ReadonlySet<string>
): number {
  let total = 0;

  for (const player of players) {
    if (typeof player !== 'object' || player === null) continue;

    const rank = (player as { rank?: unknown }).rank;
    if (typeof rank === 'string' && activeRankKeys.has(rank)) {
      total++;
    }
  }

  return total;
}

/**
 * Cuenta miembros cacheados con un rol activo.
 *
 * Es un fallback cuando `players_*.json` no se puede leer; no hace fetch de
 * miembros para evitar rate limits del gateway.
 *
 * @param guild - Servidor de Discord.
 * @param roleNames - Nombres de roles de rango activos.
 * @returns Cantidad de miembros cacheados con algún rango.
 */
function countCachedRankedMembers(
  guild: Guild,
  roleNames: ReadonlySet<string>
): number {
  let total = 0;

  for (const member of guild.members.cache.values()) {
    if (member.roles.cache.some((role) => roleNames.has(role.name))) {
      total++;
    }
  }

  return total;
}

/**
 * Cuenta miembros cacheados online con un rol activo.
 *
 * Usa presencia y caché de Discord; no hace `members.fetch()`.
 *
 * @param guild - Servidor de Discord.
 * @param roleNames - Nombres de roles de rango activos.
 * @returns Cantidad de miembros online con algún rango.
 */
function countCachedOnlineRankedMembers(
  guild: Guild,
  roleNames: ReadonlySet<string>
): number {
  let online = 0;

  for (const member of guild.members.cache.values()) {
    if (member.presence?.status !== 'online') continue;
    if (member.roles.cache.some((role) => roleNames.has(role.name))) {
      online++;
    }
  }

  return online;
}

/**
 * Obtiene estadísticas de jugadores con algún rango activo en el servidor.
 *
 * El total sale de `players_*.json` para no pedir la lista completa de miembros
 * a Discord. Los online se cuentan desde la caché y la presencia. Si el archivo
 * no se puede leer, el total cae a los miembros cacheados con rango.
 *
 * @param guild - Servidor de Discord.
 * @returns El total registrado y la cantidad de jugadores online.
 */
export async function getPlayerStats(guild: Guild) {
  const { roleNames, keys } = getActiveRankContext(guild);
  const snapshot = await getPlayerDataSnapshot(guild);
  const cachedTotal = countCachedRankedMembers(guild, roleNames);
  const online = countCachedOnlineRankedMembers(guild, roleNames);

  if (snapshot.status === 'invalid' || snapshot.status === 'io-error') {
    getServerLogger(guild.id, guild.name).warn(
      `[player-stats] players_${guild.id}.json ${snapshot.status}: ` +
        `${snapshot.error}. Se usa el conteo de caché.`
    );

    return { total: cachedTotal, online };
  }

  const total =
    snapshot.status === 'ok'
      ? countRegisteredRankedPlayers(snapshot.players, keys)
      : cachedTotal;

  return { total, online };
}

/**
 * Devuelve los miembros online de un rol de rango específico.
 *
 * @param role - Rol de rango de Apex.
 * @returns Miembros con estado online, idle o dnd.
 */
export function getOnlineMembersByRole(role: Role) {
  return role.members.filter(
    (m) =>
      m.presence?.status === 'online' ||
      m.presence?.status === 'dnd' ||
      m.presence?.status === 'idle'
  );
}
