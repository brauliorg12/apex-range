import { Guild, Role, GuildMember } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

/**
 * Obtiene todos los miembros del servidor que tienen algún rol de rango de Apex.
 * @param guild Servidor Discord.
 * @returns Array de GuildMember con algún rol de rango.
 */
async function getRankedMembers(guild: Guild): Promise<GuildMember[]> {
  try {
    const ranks = getApexRanksForGuild(guild.id, guild);

    const rankRoleNames = new Set(ranks.map((rank) => rank.roleName));
    const rankRoles = guild.roles.cache.filter((role) =>
      rankRoleNames.has(role.name)
    );

    if (rankRoles.size === 0) {
      return [];
    }

    // Fetch all members in paralelo
    await guild.members.fetch();

    const uniqueMembers = new Map<string, GuildMember>();
    rankRoles.forEach((role) => {
      role.members.forEach((member) => {
        if (!uniqueMembers.has(member.id)) {
          uniqueMembers.set(member.id, member);
        }
      });
    });

    return Array.from(uniqueMembers.values());
  } catch (error) {
    console.error('Error en getRankedMembers:', error);
    throw error;
  }
}

/**
 * Obtiene estadísticas de jugadores con algún rango de Apex en el servidor.
 * Busca todos los miembros que tengan al menos un rol de rango definido en APEX_RANKS,
 * y calcula cuántos están conectados actualmente (status 'online').
 *
 * @param guild Servidor Discord.
 * @returns Un objeto con el total de jugadores con rango y la cantidad de jugadores en línea.
 */
export async function getPlayerStats(guild: Guild) {
  try {
    const rankedMembers = await getRankedMembers(guild);
    const onlineMembers = rankedMembers.filter(
      (member) => member.presence?.status === 'online'
    );

    return {
      total: rankedMembers.length,
      online: onlineMembers.length,
    };
  } catch (error) {
    console.error('Error en getPlayerStats:', error);
    throw error;
  }
}

/**
 * Devuelve los miembros online de un rol de rango específico.
 * @param role Rol de rango de Apex.
 * @returns Colección de GuildMember que están online, idle o dnd.
 */
export function getOnlineMembersByRole(role: Role) {
  return role.members.filter(
    (m) =>
      m.presence?.status === 'online' ||
      m.presence?.status === 'dnd' ||
      m.presence?.status === 'idle'
  );
}
