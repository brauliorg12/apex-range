import { Guild } from 'discord.js';
import { logApp } from './logger';
import { mutatePlayers } from './state-manager';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { buildRankResolver } from '../helpers/rank-priority';
import type { RankResolver } from '../helpers/rank-priority';
import type { PlayerRecord } from '../interfaces/player';

/** Plataforma asignada a los registros nuevos hasta que un evento la actualice. */
const DEFAULT_PLAYER_PLATFORM = 'PC';

/** Estado de rango de un miembro presente en la caché de Discord. */
interface CachedRankState {
  /** shortId del rango de mayor `tier`; `''` si no tiene roles de rango. */
  rankShortId: string;
  /** Indica si el miembro tiene más de un rol de rango. */
  hasMultipleRankRoles: boolean;
}

/** Resumen agregado de una sincronización. */
interface SyncSummary {
  /** Registros nuevos agregados. */
  added: number;
  /** Rangos existentes modificados, incluidos los limpiados con `''`. */
  updatedRanks: number;
  /** Miembros cacheados con más de un rol de rango. */
  multiRankPlayers: number;
  /** Total de registros después de aplicar los cambios. */
  total: number;
}

/**
 * Recolecta una sola vez el rango canónico de cada miembro en caché.
 *
 * La caché de Discord es una vista parcial: se usa para agregar y reconciliar
 * rangos, nunca como evidencia para eliminar registros.
 *
 * @param guild - Guild del que se leen los miembros.
 * @param resolver - Resolvedor construido una vez para el catálogo del guild.
 * @returns Mapa `userId` → estado de rango de los miembros cacheados.
 */
function collectCachedRankStates(
  guild: Guild,
  resolver: RankResolver
): Map<string, CachedRankState> {
  const states = new Map<string, CachedRankState>();

  for (const member of guild.members.cache.values()) {
    let rankRoleCount = 0;
    for (const role of member.roles.cache.values()) {
      if (resolver.resolveRole(role.name)) {
        rankRoleCount++;
      }
    }

    const highest = resolver.pickHighest(member.roles.cache.values());
    states.set(member.id, {
      rankShortId: highest?.shortId ?? '',
      hasMultipleRankRoles: rankRoleCount > 1,
    });
  }

  return states;
}

/**
 * Aplica los rangos cacheados al registro persistido sin eliminar jugadores.
 *
 * Los miembros fuera de caché conservan su registro y su rango. Un miembro
 * cacheado sin roles de rango queda con `rank: ''`. Los registros nuevos usan
 * la plataforma por defecto documentada.
 *
 * @param players - Registro mutable del guild.
 * @param cachedStates - Estado de rango por miembro cacheado.
 * @returns Resumen de altas, rangos actualizados y multi-rangos.
 */
function applyCachedRankStates(
  players: PlayerRecord[],
  cachedStates: Map<string, CachedRankState>
): SyncSummary {
  const byUserId = new Map<string, PlayerRecord>();
  for (const record of players) {
    byUserId.set(record.userId, record);
  }

  const now = new Date().toISOString();
  let added = 0;
  let updatedRanks = 0;
  let multiRankPlayers = 0;

  for (const [userId, state] of cachedStates) {
    if (state.hasMultipleRankRoles) {
      multiRankPlayers++;
    }

    const existing = byUserId.get(userId);
    if (!existing) {
      if (!state.rankShortId) continue;

      const record: PlayerRecord = {
        userId,
        assignedAt: now,
        rank: state.rankShortId,
        platform: DEFAULT_PLAYER_PLATFORM,
      };
      players.push(record);
      byUserId.set(userId, record);
      added++;
      continue;
    }

    if (existing.rank !== state.rankShortId) {
      existing.rank = state.rankShortId;
      updatedRanks++;
    }
  }

  return { added, updatedRanks, multiRankPlayers, total: players.length };
}

/**
 * Sincroniza el registro de jugadores con los roles actuales del servidor.
 *
 * Solo agrega y actualiza registros: nunca elimina jugadores. `players_*.json`
 * es el registro global y la caché de miembros no es autoridad para borrar. Un
 * miembro cacheado sin rol conserva su registro con `rank: ''`; uno fuera de
 * caché no se modifica. Si el archivo es ilegible o inválido, no se sobrescribe
 * y el error se propaga.
 *
 * @param guild - El guild a sincronizar.
 * @throws {Error} Si el archivo de jugadores no es legible o falla la escritura.
 */
export async function synchronizePlayersWithRoles(guild: Guild): Promise<void> {
  logApp(
    `[synchronizePlayersWithRoles] 🔄 INICIANDO sincronización para guild ${guild.name} (${guild.id})`
  );

  const ranks = getApexRanksForGuild(guild.id, guild);
  const resolver = buildRankResolver(ranks);
  const cachedStates = collectCachedRankStates(guild, resolver);

  const summary = await mutatePlayers(guild.id, (players) =>
    applyCachedRankStates(players, cachedStates)
  );

  logApp(
    `[synchronizePlayersWithRoles] ✅ SINCRONIZACIÓN COMPLETADA para guild ${guild.name} (${guild.id}) | ` +
      `Miembros en caché: ${cachedStates.size} | Nuevos: ${summary.added} | ` +
      `Rangos actualizados: ${summary.updatedRanks} | ` +
      `Multi-rango: ${summary.multiRankPlayers} | ` +
      `Total de registros: ${summary.total}`
  );
}
