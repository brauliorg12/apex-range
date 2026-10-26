import { Guild, GuildMember } from 'discord.js';
import { PC_ONLY_EMOGI } from '../models/constants';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';
import type { ApexRank } from '../interfaces/apex-rank';
import { getStatusIcon } from '../interfaces/status-icon';
import { getCountryFlag } from './country-flag';
import { getRankEmoji } from './emoji-helper';
import { getPlayerPlatform } from './player-data-manager';
import { filterAllowedRoles } from './role-filter';

/** Opciones de una línea de jugador en la paginación. */
export interface PlayerLineOptions {
  /** Mostrar numeración en la lista. */
  showNumbers: boolean;
  /** Mostrar emoji de rango individual. */
  showRankEmoji: boolean;
  /** Rango por userId para el emoji individual. */
  ranksByUser?: Map<string, ApexRank>;
  /** Mostrar estado de presencia. */
  showPresence: boolean;
  /** Mostrar plataforma del jugador. */
  showPlatform: boolean;
  /** Mostrar roles/banderas de país. */
  showRoles: boolean;
  /** Mostrar fechas de registro. */
  showDates: boolean;
  /** Fechas de asignación por userId. */
  assignedDates?: Map<string, string>;
}

/**
 * Construye la línea de un jugador para el embed paginado.
 *
 * Mantiene el orden visual: número, rango, presencia, plataforma, nombre,
 * roles/banderas y fecha. Si falla un detalle, conserva la línea básica.
 *
 * @param guild - Servidor de Discord.
 * @param member - Miembro a renderizar.
 * @param position - Número de posición dentro del listado.
 * @param options - Opciones de visualización.
 * @returns La línea del jugador.
 */
export async function buildPlayerLine(
  guild: Guild,
  member: GuildMember,
  position: number,
  options: PlayerLineOptions
): Promise<string> {
  try {
    let line = '';

    if (options.showNumbers) {
      line += `${position}. `;
    }

    if (options.showRankEmoji && options.ranksByUser) {
      const userRank = options.ranksByUser.get(member.id);
      if (userRank) {
        const rankEmoji = getRankEmoji(guild.client, userRank);
        line += `${rankEmoji} `;
      }
    }

    if (options.showPresence) {
      const status = member.presence?.status || 'offline';
      const icon = getStatusIcon(status);
      line += `${icon} `;
    }

    if (options.showPlatform) {
      try {
        const platforms = getApexPlatformsForGuild(guild.id, guild);
        const platform = await getPlayerPlatform(guild.id, member.id);
        const platformInfo = platforms.find((p) => p.apiName === platform);
        const platformIcon = platformInfo?.id || PC_ONLY_EMOGI;
        line += `${platformIcon} `;
      } catch {
        line += `${PC_ONLY_EMOGI} `;
      }
    }

    const displayName = member.displayName || 'Usuario';
    line += `\`${displayName}\` <@${member.id}>`;

    if (options.showRoles) {
      try {
        const allowedRoles = member.roles?.cache
          ? filterAllowedRoles(
              member.roles.cache.map((role) => role),
              guild
            )
          : [];
        if (allowedRoles.length) {
          const rolesDisplay = allowedRoles
            .map((role) => {
              const flag = getCountryFlag(role.name);
              const capitalized =
                role.name.charAt(0).toUpperCase() +
                role.name.slice(1).toLowerCase();
              return flag !== role.name
                ? `${flag} _${capitalized}_`
                : `_${capitalized}_`;
            })
            .join(', ');
          line += ` (${rolesDisplay})`;
        }
      } catch {
        // Ignorar error en roles.
      }
    }

    if (options.showDates && options.assignedDates) {
      try {
        const assignedAt = options.assignedDates.get(member.id);
        if (assignedAt) {
          const timestamp = Math.floor(
            new Date(assignedAt).getTime() / 1000
          );
          line += ` - _<t:${timestamp}:R>_`;
        }
      } catch {
        // Ignorar error en fechas.
      }
    }

    return line;
  } catch {
    return `<@${member.id}>`;
  }
}
