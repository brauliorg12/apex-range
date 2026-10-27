import { Guild } from 'discord.js';
import { buildPlatformIconByApiName } from '../helpers/get-apex-platforms-for-guild';
import { buildPlayerLookup, getPlayerData } from './player-data-manager';

/** Mapas de plataforma usados por una paginación de jugadores. */
export interface PlayerPlatformMaps {
  /** Plataforma por userId. */
  platformByUserId: ReadonlyMap<string, string>;
  /** Ícono por `apiName` de plataforma. */
  platformIconByApiName: ReadonlyMap<string, string>;
}

/**
 * Completa los mapas de plataforma de una paginación.
 *
 * Si el llamador ya pasó ambos mapas, los reutiliza. Si falta alguno, lee el
 * snapshot cacheado de jugadores una sola vez y resuelve los íconos del guild.
 *
 * @param guild - Servidor de Discord.
 * @param platformByUserId - Mapa opcional de plataforma por userId.
 * @param platformIconByApiName - Mapa opcional de ícono por apiName.
 * @returns Los mapas completos.
 */
export async function resolvePlayerPlatformMaps(
  guild: Guild,
  platformByUserId?: ReadonlyMap<string, string>,
  platformIconByApiName?: ReadonlyMap<string, string>
): Promise<PlayerPlatformMaps> {
  if (platformByUserId && platformIconByApiName) {
    return { platformByUserId, platformIconByApiName };
  }

  const lookup = buildPlayerLookup(await getPlayerData(guild));

  return {
    platformByUserId: platformByUserId ?? lookup.platformByUserId,
    platformIconByApiName:
      platformIconByApiName ?? buildPlatformIconByApiName(guild.id, guild),
  };
}
