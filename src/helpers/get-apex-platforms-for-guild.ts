import { Guild } from 'discord.js';
import { ApexPlatform } from '../interfaces/apex-platform';
import { loadServerConfig } from '../utils/server-config';
import { APEX_PLATFORMS } from '../models/constants';

/**
 * Obtiene la lista de plataformas de Apex Legends con nombres de roles personalizados para un servidor.
 * Valida que los roles mapeados existan en Discord; si no, usa nombres por defecto.
 * @param guildId ID del servidor de Discord.
 * @param guild Instancia del Guild de Discord (opcional, para validación).
 * @returns Lista de plataformas con roleName validado.
 */
export function getApexPlatformsForGuild(
  guildId: string,
  guild?: Guild
): ApexPlatform[] {
  const config = loadServerConfig(guildId);
  return APEX_PLATFORMS.map((platform) => {
    const mappedName = config[platform.shortId] || platform.roleName;
    // Si guild está disponible, valida si el rol existe
    if (guild) {
      const roleExists = guild.roles.cache.some(
        (r: any) => r.name === mappedName
      );
      return {
        ...platform,
        roleName: roleExists ? mappedName : platform.roleName, // Usa por defecto si no existe
      };
    }
    // Si no hay guild, usa el mapeo sin validar
    return {
      ...platform,
      roleName: mappedName,
    };
  });
}
