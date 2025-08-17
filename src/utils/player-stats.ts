import { Guild, Role, GuildMember } from 'discord.js';
import { APEX_RANKS } from '../constants';

async function getMembersWithRankRole(guild: Guild): Promise<GuildMember[]> {
  await guild.members.fetch();
  const rankRoleNames = new Set(APEX_RANKS.map((rank) => rank.roleName));
  const membersWithRankRole: GuildMember[] = [];
  const memberSet = new Set<string>();

  guild.roles.cache
    .filter((role) => rankRoleNames.has(role.name))
    .forEach((role) => {
      role.members.forEach((member) => {
        if (!memberSet.has(member.id)) {
          membersWithRankRole.push(member);
          memberSet.add(member.id);
        }
      });
    });

  return membersWithRankRole;
}

export async function getTotalUniquePlayers(guild: Guild): Promise<number> {
  const membersWithRankRole = await getMembersWithRankRole(guild);
  return membersWithRankRole.length;
}

export async function getOnlinePlayerCount(guild: Guild): Promise<number> {
  const membersWithRankRole = await getMembersWithRankRole(guild);
  const onlineMembers = membersWithRankRole.filter(
    (member) =>
      member.presence?.status === 'online' ||
      member.presence?.status === 'dnd' ||
      member.presence?.status === 'idle'
  );
  return onlineMembers.length;
}

export function getOnlineMembersByRole(role: Role) {
  return role.members.filter(
    (m) =>
      m.presence?.status === 'online' ||
      m.presence?.status === 'dnd' ||
      m.presence?.status === 'idle'
  );
}
