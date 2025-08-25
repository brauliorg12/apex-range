import { Guild, Role, GuildMember } from 'discord.js';
import { APEX_RANKS } from '../constants';

/**
 * Obtiene todos los miembros del servidor que tienen algún rol de rango de Apex.
 * @param guild Servidor Discord.
 * @returns Array de GuildMember con algún rol de rango.
 */
async function getRankedMembers(guild: Guild): Promise<GuildMember[]> {
  const rankRoleNames = new Set(APEX_RANKS.map((rank) => rank.roleName));
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
}

/**
 * Devuelve estadísticas de jugadores con rango en el servidor.
 * @param guild Servidor Discord.
 * @returns Objeto con total de jugadores con rango y cuántos están online.
 */
export async function getPlayerStats(guild: Guild) {
  const rankedMembers = await getRankedMembers(guild);
  const onlineMembers = rankedMembers.filter(
    (member) =>
      member.presence?.status === 'online' ||
      member.presence?.status === 'dnd' ||
      member.presence?.status === 'idle'
  );

  return {
    total: rankedMembers.length,
    online: onlineMembers.length,
  };
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
