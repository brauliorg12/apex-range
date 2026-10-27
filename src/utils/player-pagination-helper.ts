import {
  EmbedBuilder,
  Guild,
  GuildMember,
  ColorResolvable,
} from 'discord.js';
import { logApp } from './logger';
import { buildPlayerPaginationError } from './player-pagination-error';
import {
  buildPaginationDescription,
  buildPaginationMemberLines,
  fetchPaginationMembers,
} from './player-pagination-content';
import { resolvePlayerPlatformMaps } from './player-pagination-platform';
import {
  buildPlayerPaginationComponents,
  calculatePlayerPagination,
} from './player-pagination-controls';
import type { ApexRank } from '../interfaces/apex-rank';

/**
 * Configuración para la paginación de jugadores.
 */
export interface PlayerPaginationConfig {
  /** Array de miembros a paginar */
  members: GuildMember[];
  /** Página actual (inicia en 1) */
  page: number;
  /** Jugadores por página */
  playersPerPage: number;
  /** ID base para los botones de navegación */
  buttonIdPrefix: string;
  /** Color del embed */
  color: ColorResolvable;
  /** Título del embed */
  title: string;
  /** Información del rango (opcional) */
  rank?: ApexRank;
  /** URL de imagen para el embed (opcional) */
  imageUrl?: string;
  /** Mostrar numeración en la lista */
  showNumbers?: boolean;
  /** Mostrar estado de presencia (online/offline) */
  showPresence?: boolean;
  /** Mostrar plataforma del jugador */
  showPlatform?: boolean;
  /** Mostrar roles/banderas de país */
  showRoles?: boolean;
  /** Mapa de fechas de asignación por userId */
  assignedDates?: Map<string, string>;
  /** Mostrar fechas de registro */
  showDates?: boolean;
  /** Mapa de rangos por userId para mostrar emoji de rango individual */
  ranksByUser?: Map<string, ApexRank>;
  /** Mostrar emoji de rango individual por jugador */
  showRankEmoji?: boolean;
  /** Usar displayName en lugar de menciones */
  useDisplayName?: boolean;
  /** Plataforma por userId para evitar lecturas por jugador. */
  platformByUserId?: ReadonlyMap<string, string>;
  /** Ícono por apiName de plataforma para evitar lecturas por jugador. */
  platformIconByApiName?: ReadonlyMap<string, string>;
}

/**
 * Genera un embed paginado de jugadores con estilo consistente.
 *
 * Este helper unifica el estilo de paginación usado en diferentes partes del bot,
 * proporcionando una interfaz consistente para mostrar listas de jugadores con
 * información adicional como estado, plataforma, roles y fechas de registro.
 *
 * @param guild Servidor de Discord donde se muestran los jugadores.
 * @param config Configuración de la paginación y estilo del embed.
 * @returns Objeto con el embed, componentes de navegación y metadatos de paginación.
 */
export async function createPlayerPaginationEmbed(
  guild: Guild,
  config: PlayerPaginationConfig
) {
  try {
    const {
      members,
      page,
      playersPerPage,
      buttonIdPrefix,
      color,
      title,
      rank,
      imageUrl,
      showNumbers = false,
      showPresence = true,
      showPlatform = true,
      showRoles = true,
      assignedDates,
      showDates = false,
      ranksByUser,
      showRankEmoji = false,
      platformByUserId,
      platformIconByApiName,
    } = config;

    const platformMaps = showPlatform
      ? await resolvePlayerPlatformMaps(
          guild,
          platformByUserId,
          platformIconByApiName
        )
      : undefined;

    const {
      totalPlayers,
      totalPages,
      pageNum,
      startIdx,
      endIdx,
      pageMembers,
    } = calculatePlayerPagination(members, page, playersPerPage);

    let description = buildPaginationDescription(
      guild,
      rank,
      members,
      totalPlayers
    );

    await fetchPaginationMembers(guild, pageMembers, pageNum);

    if (pageMembers.length > 0) {
      const memberLines = await buildPaginationMemberLines(
        guild,
        pageMembers,
        startIdx,
        {
          showNumbers,
          showRankEmoji,
          ranksByUser,
          showPresence,
          showPlatform,
          showRoles,
          showDates,
          assignedDates,
          platformByUserId: platformMaps?.platformByUserId,
          platformIconByApiName: platformMaps?.platformIconByApiName,
        }
      );

      if (description) {
        description += '\n\n';
      }
      description += memberLines;
    } else {
      if (description) {
        description += '\n\n';
      }
      description += '_No hay jugadores en esta página._';
    }

    const MAX_DESCRIPTION_LENGTH = 4096;
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      await logApp(
        `[createPlayerPaginationEmbed] ⚠️ ADVERTENCIA: Descripción excede límite: ${description.length} > ${MAX_DESCRIPTION_LENGTH}. Considera reducir PLAYERS_PER_PAGE.`
      );
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setTimestamp();

    if (title && title.trim().length > 0) {
      embed.setTitle(title);
    }

    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    let footerText = `📄 Página ${pageNum} de ${totalPages} | 👥 Mostrando jugadores ${
      startIdx + 1
    }-${Math.min(endIdx, totalPlayers)} de ${totalPlayers}`;
    embed.setFooter({ text: footerText });

    const components = buildPlayerPaginationComponents(
      pageNum,
      totalPages,
      buttonIdPrefix
    );

    return {
      embed,
      components,
      page: pageNum,
      totalPages,
      totalPlayers,
    };
  } catch (error) {
    return buildPlayerPaginationError(error);
  }
}
