import { Guild, Role } from 'discord.js';
import { APEX_RANKS } from '../constants';

export async function getTotalUniquePlayers(guild: Guild): Promise<number> {
  await guild.members.fetch(); // Asegura que todos los miembros estén en caché

  const allRankRoleNames = APEX_RANKS.map((rank) => rank.roleName);
  const uniquePlayersWithRank = new Set<string>();

  for (const roleName of allRankRoleNames) {
    const role = guild.roles.cache.find((r) => r.name === roleName);
    if (role) {
      role.members.forEach((member) => {
        uniquePlayersWithRank.add(member.id);
      });
    }
  }

  return uniquePlayersWithRank.size;
}

export async function getOnlinePlayersCount(guild: Guild): Promise<number> {
  await guild.members.fetch(); // Asegura que todos los miembros y sus presencias estén en caché

  const allRankRoleNames = APEX_RANKS.map((rank) => rank.roleName);
  const uniqueOnlinePlayers = new Set<string>();

  for (const roleName of allRankRoleNames) {
    const role = guild.roles.cache.find((r) => r.name === roleName);
    if (role) {
      role.members.forEach((member) => {
        if (
          member.presence?.status === 'online' ||
          member.presence?.status === 'dnd' ||
          member.presence?.status === 'idle'
        ) {
          uniqueOnlinePlayers.add(member.id);
        }
      });
    }
  }

  return uniqueOnlinePlayers.size;
}

export function getOnlineMembersByRole(role: Role) {
  return role.members.filter(
    (m) =>
      m.presence?.status === 'online' ||
      m.presence?.status === 'dnd' ||
      m.presence?.status === 'idle'
  );
}
