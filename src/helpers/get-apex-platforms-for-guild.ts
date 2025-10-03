import { Guild } from 'discord.js';
import { ApexPlatform } from '../interfaces/apex-platform';
import { loadServerConfig } from '../utils/server-config';
import { APEX_PLATFORMS } from '../models/constants';
import { PLATFORM_ALIASES } from '../models/constants-roles';

/**
 * Busca un rol en el guild, considerando alias conocidos.
 * @param guild Instancia del Guild de Discord.
 * @param shortId ID corto de la plataforma.
 * @param primaryName Nombre principal (del mapeo o constante).
 * @returns El nombre del rol encontrado en Discord, o el primaryName si no existe.
 */
function findRoleWithAliases(
  guild: Guild,
  shortId: string,
  primaryName: string
): string {
  // 1. Intentar con el nombre principal
  const primaryRole = guild.roles.cache.find((r) => r.name === primaryName);
  if (primaryRole) {
    return primaryName;
  }

  // 2. Buscar entre los alias conocidos
  const aliases = PLATFORM_ALIASES[shortId] || [];
  for (const alias of aliases) {
    const role = guild.roles.cache.find((r) => r.name === alias);
    if (role) {
      return role.name;
    }
  }

  // 3. Si no encuentra nada, devolver el nombre principal (para creación si es necesario)
  return primaryName;
}

/**
 * Obtiene la lista de plataformas de Apex Legends con nombres de roles personalizados para un servidor.
 * Valida que los roles mapeados existan en Discord; si no, usa nombres por defecto o alias.
 * @param guildId ID del servidor de Discord.
 * @param guild Instancia del Guild de Discord (opcional, para validación y alias).
 * @returns Lista de plataformas con roleName validado.
 */
export function getApexPlatformsForGuild(
  guildId: string,
  guild?: Guild
): ApexPlatform[] {
  const config = loadServerConfig(guildId);
  return APEX_PLATFORMS.map((platform) => {
    const mappedName = config.ranks[platform.shortId] || platform.roleName;
    // Si guild está disponible, valida si el rol existe (con soporte de alias)
    if (guild) {
      const actualRoleName = findRoleWithAliases(
        guild,
        platform.shortId,
        mappedName
      );
      return {
        ...platform,
        roleName: actualRoleName,
      };
    }
    // Si no hay guild, usa el mapeo sin validar
    return {
      ...platform,
      roleName: mappedName,
    };
  });
}
