import { Guild, Role } from 'discord.js';
import { ApexRank } from '../interfaces/apex-rank';
import { ApexPlatform } from '../interfaces/apex-platform';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';

/**
 * Resuelve un rol de Discord a partir de un rank shortId
 * @param guild - Guild de Discord
 * @param rankShortId - ShortId del rank (ej: 'master', 'diamond')
 * @returns Role de Discord o undefined si no se encuentra
 */
export function resolveRankRole(
  guild: Guild,
  rankShortId: string
): Role | undefined {
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rank = ranks.find((r) => r.shortId === rankShortId);
  
  if (!rank) return undefined;
  
  return guild.roles.cache.find((r) => r.name === rank.roleName);
}

/**
 * Resuelve un rol de Discord a partir de un platform shortId
 * @param guild - Guild de Discord
 * @param platformShortId - ShortId de la plataforma (ej: 'pc', 'psn')
 * @returns Role de Discord o undefined si no se encuentra
 */
export function resolvePlatformRole(
  guild: Guild,
  platformShortId: string
): Role | undefined {
  const platforms = getApexPlatformsForGuild(guild.id, guild);
  const platform = platforms.find((p) => p.shortId === platformShortId);
  
  if (!platform) return undefined;
  
  return guild.roles.cache.find((r) => r.name === platform.roleName);
}

/**
 * Obtiene el shortId de un rank a partir del nombre del rol
 * @param guild - Guild de Discord
 * @param roleName - Nombre del rol
 * @returns ShortId del rank o undefined si no se encuentra
 */
export function getRankShortIdFromRole(
  guild: Guild,
  roleName: string
): string | undefined {
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rank = ranks.find((r) => r.roleName === roleName);
  return rank?.shortId;
}

/**
 * Obtiene el shortId de una plataforma a partir del nombre del rol
 * @param guild - Guild de Discord
 * @param roleName - Nombre del rol
 * @returns ShortId de la plataforma o undefined si no se encuentra
 */
export function getPlatformShortIdFromRole(
  guild: Guild,
  roleName: string
): string | undefined {
  const platforms = getApexPlatformsForGuild(guild.id, guild);
  const platform = platforms.find((p) => p.roleName === roleName);
  return platform?.shortId;
}

/**
 * Obtiene el objeto ApexRank completo desde un rol de Discord
 * @param guild - Guild de Discord
 * @param role - Rol de Discord
 * @returns ApexRank o undefined si no se encuentra
 */
export function getApexRankFromRole(
  guild: Guild,
  role: Role
): ApexRank | undefined {
  const ranks = getApexRanksForGuild(guild.id, guild);
  return ranks.find((r) => r.roleName === role.name);
}

/**
 * Obtiene el objeto ApexPlatform completo desde un rol de Discord
 * @param guild - Guild de Discord
 * @param role - Rol de Discord
 * @returns ApexPlatform o undefined si no se encuentra
 */
export function getApexPlatformFromRole(
  guild: Guild,
  role: Role
): ApexPlatform | undefined {
  const platforms = getApexPlatformsForGuild(guild.id, guild);
  return platforms.find((p) => p.roleName === role.name);
}

/**
 * Valida que todos los roles mapeados existan en el servidor
 * @param guild - Guild de Discord
 * @returns Objeto con estado de validación y roles faltantes
 */
export function validateServerRoleMappings(guild: Guild): {
  valid: boolean;
  missingRanks: string[];
  missingPlatforms: string[];
} {
  const ranks = getApexRanksForGuild(guild.id, guild);
  const platforms = getApexPlatformsForGuild(guild.id, guild);
  
  const missingRanks = ranks
    .filter((rank) => !guild.roles.cache.some((r) => r.name === rank.roleName))
    .map((rank) => rank.shortId);
  
  const missingPlatforms = platforms
    .filter((platform) => !guild.roles.cache.some((r) => r.name === platform.roleName))
    .map((platform) => platform.shortId);
  
  return {
    valid: missingRanks.length === 0 && missingPlatforms.length === 0,
    missingRanks,
    missingPlatforms,
  };
}

/**
 * Obtiene todos los roles de rank que tiene un miembro
 * @param guild - Guild de Discord
 * @param memberRoles - Collection de roles del miembro
 * @returns Array de ApexRank que tiene el miembro
 */
export function getMemberRanks(
  guild: Guild,
  memberRoles: Role[]
): ApexRank[] {
  const ranks = getApexRanksForGuild(guild.id, guild);
  return ranks.filter((rank) =>
    memberRoles.some((role) => role.name === rank.roleName)
  );
}

/**
 * Obtiene todos los roles de plataforma que tiene un miembro
 * @param guild - Guild de Discord
 * @param memberRoles - Collection de roles del miembro
 * @returns Array de ApexPlatform que tiene el miembro
 */
export function getMemberPlatforms(
  guild: Guild,
  memberRoles: Role[]
): ApexPlatform[] {
  const platforms = getApexPlatformsForGuild(guild.id, guild);
  return platforms.filter((platform) =>
    memberRoles.some((role) => role.name === platform.roleName)
  );
}
