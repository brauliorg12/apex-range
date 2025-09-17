import { GuildMember } from 'discord.js';
import { COMMON_APEX_ROLE_NAME } from '../models/constants';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';

// Asigna el rol común "Apex" si no lo tiene
export async function ensureCommonApexRole(member: GuildMember) {
  const role = member.guild.roles.cache.find(
    (r) => r.name === COMMON_APEX_ROLE_NAME
  );
  if (role && !member.roles.cache.has(role.id)) {
    await member.roles.add(role);
  }
}

// Remueve el rol común "Apex" si el usuario no tiene ningún rango de Apex
export async function removeCommonApexRoleIfNoRank(member: GuildMember) {
  const ranks = getApexRanksForGuild(member.guild.id, member.guild);
  const hasAnyRank = ranks.some((rank) =>
    member.roles.cache.some((r) => r.name === rank.roleName)
  );
  const role = member.guild.roles.cache.find(
    (r) => r.name === COMMON_APEX_ROLE_NAME
  );
  if (role && !hasAnyRank && member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
  }
}
