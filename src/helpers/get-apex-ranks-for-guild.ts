import { Guild } from 'discord.js';
import { ApexRank } from '../interfaces/apex-rank';
import { loadServerConfig } from '../utils/server-config';
import { APEX_RANKS } from '../models/constants';
import { RANK_ALIASES } from '../models/constants-roles';

/**
 * Busca un rol en el guild considerando aliases
 */
function findRoleWithAliases(
  guild: Guild,
  shortId: string,
  primaryName: string
): string {
  // Primero intentar con el nombre primario
  const primaryRole = guild.roles.cache.find((r) => r.name === primaryName);
  if (primaryRole) return primaryName;

  // Buscar usando aliases
  const aliases = RANK_ALIASES[shortId] || [];
  for (const alias of aliases) {
    const role = guild.roles.cache.find((r) => r.name === alias);
    if (role) return role.name;
  }

  // Si no encuentra nada, devolver el nombre primario
  return primaryName;
}

/**
 * Obtiene la lista de rangos de Apex Legends con nombres de roles personalizados para un servidor.
 * Valida que los roles mapeados existan en Discord; si no, busca aliases o usa nombres por defecto.
 * @param guildId ID del servidor de Discord.
 * @param guild Instancia del Guild de Discord (opcional, para validación).
 * @returns Lista de rangos con roleName validado.
 */
export function getApexRanksForGuild(
  guildId: string,
  guild?: Guild
): ApexRank[] {
  const config = loadServerConfig(guildId);
  return APEX_RANKS.map((rank) => {
    const mappedName = config.ranks[rank.shortId] || rank.roleName;

    // Si guild está disponible, busca el rol con aliases
    if (guild) {
      const actualRoleName = findRoleWithAliases(
        guild,
        rank.shortId,
        mappedName
      );
      return {
        ...rank,
        roleName: actualRoleName,
      };
    }

    // Si no hay guild, usa el mapeo sin validar
    return {
      ...rank,
      roleName: mappedName,
    };
  });
}
