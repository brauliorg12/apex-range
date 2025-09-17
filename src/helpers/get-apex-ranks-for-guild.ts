import { Guild } from 'discord.js';
import { ApexRank } from '../interfaces/apex-rank';
import { loadServerConfig } from '../utils/server-config';
import { APEX_RANKS } from '../models/constants';

/**
 * Obtiene la lista de rangos de Apex Legends con nombres de roles personalizados para un servidor.
 * Valida que los roles mapeados existan en Discord; si no, usa nombres por defecto.
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
    const mappedName = config[rank.shortId] || rank.roleName;
    // Si guild está disponible, valida si el rol existe
    if (guild) {
      const roleExists = guild.roles.cache.some(
        (r: any) => r.name === mappedName
      );
      return {
        ...rank,
        roleName: roleExists ? mappedName : rank.roleName, // Usa por defecto si no existe
      };
    }
    // Si no hay guild, usa el mapeo sin validar
    return {
      ...rank,
      roleName: mappedName,
    };
  });
}
