import { Role, Guild } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { loadServerConfig, saveServerConfig } from './server-config';
import { APEX_PLATFORMS } from '../models/constants';

/**
 * Obtiene la lista de nombres de roles excluidos desde la configuración.
 * Si no hay configuración específica, devuelve vacío (no excluir ninguno).
 * @param guildId ID del servidor
 * @returns Array de nombres de roles excluidos
 */
export function getExcludedRolesForGuild(guildId: string): string[] {
  const config = loadServerConfig(guildId);
  return config.excludedRoles || [];
}

/**
 * Guarda la lista de roles excluidos para un servidor en la configuración.
 * @param guildId ID del servidor
 * @param roles Array de nombres de roles
 */
export function setExcludedRolesForGuild(
  guildId: string,
  roles: string[]
): void {
  try {
    const config = loadServerConfig(guildId);
    config.excludedRoles = roles;
    saveServerConfig(guildId, config);
  } catch (error) {
    console.error('Error saving excluded roles:', error);
    // No lanzar, para no romper la interacción
  }
}

/**
 * Filtra los roles permitidos para mostrar junto al usuario.
 * Excluye: @everyone, roles de rango, plataformas, y los definidos en excludedRoles.
 * Incluye: roles de países para mostrar banderas.
 * @param roles Array de roles de Discord
 * @param guild El servidor de Discord
 * @returns Array de roles permitidos
 */
export function filterAllowedRoles(roles: Role[], guild: Guild): Role[] {
  const excluded = getExcludedRolesForGuild(guild.id);
  const ranks = getApexRanksForGuild(guild.id, guild);
  return roles.filter(
    (role) =>
      role.name !== '@everyone' &&
      !ranks.some((rank) => rank.roleName === role.name) &&
      !APEX_PLATFORMS.some((platform) => platform.roleName === role.name) &&
      !excluded.includes(role.name)
  );
}
