import { Guild } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { buildRankResolver } from '../helpers/rank-priority';
import type { RankResolver } from '../helpers/rank-priority';
import type { Player } from '../interfaces/player';
import { logApp } from '../utils/logger';

/**
 * Obtiene todos los jugadores del servidor que tienen algún rol de rango de Apex Legends desde la caché.
 *
 * Utiliza el sistema de mapeo de roles para soportar roles personalizados del servidor.
 * Recorre todos los miembros en caché y resuelve el rango más alto de cada uno.
 *
 * NOTA: Solo usa miembros en caché para evitar errores de rate limit en servidores grandes.
 * Esta función se usa principalmente para determinar el modo de visualización (normal/paginado)
 * basándose en la cantidad total de jugadores. Para servidores grandes (1000+), la lista
 * paginada usa playerData en lugar del caché para mayor estabilidad. La caché es una vista
 * parcial: nunca debe usarse como evidencia para eliminar registros de `players_*.json`.
 *
 * @param guild Servidor de Discord donde buscar los jugadores.
 * @param resolver - Resolvedor reutilizable; si se omite, se construye para
 *   el guild.
 * @returns Lista de jugadores con su rango más alto encontrado en caché.
 */
export async function getAllRankedPlayers(
  guild: Guild,
  resolver?: RankResolver
): Promise<Player[]> {
  await logApp(
    `[getAllRankedPlayers] Obteniendo jugadores en caché para guild ${guild.name} (${guild.id})`
  );
  await logApp(
    `[getAllRankedPlayers] Miembros en caché: ${guild.members.cache.size}`
  );

  const players: Player[] = [];
  const rankResolver =
    resolver ?? buildRankResolver(getApexRanksForGuild(guild.id, guild));

  guild.members.cache.forEach((member) => {
    const rankRoles = member.roles.cache.filter(
      (role) => rankResolver.resolveRole(role.name) !== undefined
    );
    if (rankRoles.size === 0) return;

    const highest = rankResolver.pickHighest(rankRoles.values());
    if (highest) {
      players.push({
        member,
        rankName: highest.roleName,
        hasMultipleRankRoles: rankRoles.size > 1,
      });
    }
  });

  await logApp(
    `[getAllRankedPlayers] Se encontraron ${players.length} jugadores con rangos`
  );

  return players;
}
