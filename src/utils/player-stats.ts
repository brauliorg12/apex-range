import { Guild, Role, GuildMember } from 'discord.js';
import { APEX_RANKS } from '../constants';

async function getRankedMembers(guild: Guild): Promise<GuildMember[]> {
  const rankRoleNames = new Set(APEX_RANKS.map((rank) => rank.roleName));
  const rankRoles = guild.roles.cache.filter((role) =>
    rankRoleNames.has(role.name)
  );

  if (rankRoles.size === 0) {
    return [];
  }

  // Fetch all members in parallel
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

export function getOnlineMembersByRole(role: Role) {
  return role.members.filter(
    (m) =>
      m.presence?.status === 'online' ||
      m.presence?.status === 'dnd' ||
      m.presence?.status === 'idle'
  );
}
