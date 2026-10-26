import {
  EmbedBuilder,
  Guild,
  GuildMember,
  ColorResolvable,
} from 'discord.js';
import { createCloseButtonRow } from './button-helper';
import { getRankEmoji } from './emoji-helper';
import { logApp } from './logger';
import { buildPlayerLine } from './player-pagination-line';
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
    } = config;

    const {
      totalPlayers,
      totalPages,
      pageNum,
      startIdx,
      endIdx,
      pageMembers,
    } = calculatePlayerPagination(members, page, playersPerPage);

    let description = '';

    if (rank) {
      const rankEmoji = getRankEmoji(guild.client, rank);
      const onlineCount = members.filter(
        (m) => m.presence && m.presence.status === 'online'
      ).length;
      const jugadoresLabel = onlineCount === 1 ? '_jugador_' : '_jugadores_';

      if (onlineCount > 0) {
        description = `> ${rankEmoji} **${onlineCount}** ${jugadoresLabel} en línea de **${totalPlayers}**`;
      } else {
        description = `> ${rankEmoji} ${onlineCount} jugadores en línea de **${totalPlayers}**`;
      }
    }

    await logApp(
      `[createPlayerPaginationEmbed] 🔄 Haciendo fetch de ${pageMembers.length} miembros para resolver menciones...`
    );
    try {
      const fetchPromises = pageMembers.map(async (m) => {
        if (!guild.members.cache.has(m.id)) {
          try {
            await guild.members.fetch(m.id);
          } catch {
            // Ignorar errores individuales (usuario pudo haberse ido del servidor)
          }
        }
      });
      await Promise.all(fetchPromises);
      await logApp(
        `[createPlayerPaginationEmbed] ✅ Fetch completado para página ${pageNum}`
      );
    } catch (fetchError) {
      await logApp(
        `[createPlayerPaginationEmbed] ⚠️ Error al hacer fetch: ${fetchError}`
      );
    }

    if (pageMembers.length > 0) {
      const memberLines = await Promise.all(
        pageMembers.map((member, idx) =>
          buildPlayerLine(guild, member, startIdx + idx + 1, {
            showNumbers,
            showRankEmoji,
            ranksByUser,
            showPresence,
            showPlatform,
            showRoles,
            showDates,
            assignedDates,
          })
        )
      );

      if (description) {
        description += '\n\n';
      }
      description += memberLines.join('\n');
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
    await logApp(
      `[createPlayerPaginationEmbed] ❌ ERROR al generar lista de jugadores: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    await logApp(
      `[createPlayerPaginationEmbed] Stack trace: ${
        error instanceof Error ? error.stack : 'N/A'
      }`
    );

    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error al generar lista')
      .setDescription('Hubo un error al procesar la lista de jugadores.')
      .setTimestamp();

    return {
      embed: errorEmbed,
      components: [createCloseButtonRow()],
      page: 1,
      totalPages: 1,
      totalPlayers: 0,
    };
  }
}
