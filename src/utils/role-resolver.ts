import { Guild } from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';

/**
 * Valida que todos los roles mapeados de rangos y plataformas existan en el
 * servidor.
 *
 * @param guild - Guild de Discord a validar.
 * @returns Estado de validación y los shortIds faltantes por categoría.
 */
export function validateServerRoleMappings(guild: Guild): {
  /** Indica si todos los roles mapeados existen. */
  valid: boolean;
  /** shortIds de rangos sin rol en el guild. */
  missingRanks: string[];
  /** shortIds de plataformas sin rol en el guild. */
  missingPlatforms: string[];
} {
  const ranks = getApexRanksForGuild(guild.id, guild);
  const platforms = getApexPlatformsForGuild(guild.id, guild);

  const missingRanks = ranks
    .filter((rank) => !guild.roles.cache.some((r) => r.name === rank.roleName))
    .map((rank) => rank.shortId);

  const missingPlatforms = platforms
    .filter(
      (platform) => !guild.roles.cache.some((r) => r.name === platform.roleName)
    )
    .map((platform) => platform.shortId);

  return {
    valid: missingRanks.length === 0 && missingPlatforms.length === 0,
    missingRanks,
    missingPlatforms,
  };
}
