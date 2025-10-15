import {
  EmbedBuilder,
  Guild,
  GuildMember,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ColorResolvable,
} from 'discord.js';
import { getRankEmoji } from './emoji-helper';
import { getStatusIcon } from '../interfaces/status-icon';
import { filterAllowedRoles } from './role-filter';
import { getCountryFlag } from './country-flag';
import { getPlayerPlatform } from './player-data-manager';
import { getApexPlatformsForGuild } from '../helpers/get-apex-platforms-for-guild';
import { PC_ONLY_EMOGI } from '../models/constants';
import { ApexRank } from '../interfaces/apex-rank';
import { createCloseButtonRow } from './button-helper';
import { logApp } from './logger';

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
      useDisplayName = false,
    } = config;

    // Calcular paginación
    const totalPlayers = members.length;
    const totalPages = Math.ceil(totalPlayers / playersPerPage);
    const pageNum = Math.max(1, Math.min(page, totalPages));

    // Obtener jugadores de la página actual
    const startIdx = (pageNum - 1) * playersPerPage;
    const endIdx = startIdx + playersPerPage;
    const pageMembers = members.slice(startIdx, endIdx);

    // Construir descripción
    let description = '';

    // Si hay información de rango, mostrar encabezado con estadísticas
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

    // Generar lista de jugadores
    if (pageMembers.length > 0) {
      const memberLines = await Promise.all(
        pageMembers.map(async (member, idx) => {
          try {
            const numero = startIdx + idx + 1;
            let line = '';

            // Numeración
            if (showNumbers) {
              line += `${numero}. `;
            }

            // Emoji de rango individual
            if (showRankEmoji && ranksByUser) {
              const userRank = ranksByUser.get(member.id);
              if (userRank) {
                const rankEmoji = getRankEmoji(guild.client, userRank);
                line += `${rankEmoji} `;
              }
            }

            // Estado de presencia
            if (showPresence) {
              const status = member.presence?.status || 'offline';
              const icon = getStatusIcon(status);
              line += `${icon} `;
            }

            // Plataforma
            if (showPlatform) {
              try {
                const platforms = getApexPlatformsForGuild(guild.id, guild);
                const platform = await getPlayerPlatform(guild.id, member.id);
                const platformInfo = platforms.find(
                  (p) => p.apiName === platform
                );
                const platformIcon = platformInfo?.id || PC_ONLY_EMOGI;
                line += `${platformIcon} `;
              } catch (error) {
                // Si falla, usar icono por defecto
                line += `${PC_ONLY_EMOGI} `;
              }
            }

            // Nombre del jugador (mención o displayName)
            if (useDisplayName) {
              line += `\`${member.displayName}\``;
            } else {
              line += `<@${member.id}>`;
            }

            // Roles/banderas
            if (showRoles) {
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
              } catch (error) {
                // Ignorar error en roles
              }
            }

            // Fecha de registro
            if (showDates && assignedDates) {
              try {
                const assignedAt = assignedDates.get(member.id);
                if (assignedAt) {
                  const timestamp = Math.floor(
                    new Date(assignedAt).getTime() / 1000
                  );
                  line += ` - _<t:${timestamp}:R>_`;
                }
              } catch (error) {
                // Ignorar error en fechas
              }
            }

            return line;
          } catch (error) {
            // Si falla completamente, retornar una línea básica
            return `<@${member.id}>`;
          }
        })
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

    // Verificar límite de Discord (4096 caracteres para descripción) - solo para logs
    const MAX_DESCRIPTION_LENGTH = 4096;
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      await logApp(
        `[createPlayerPaginationEmbed] ⚠️ ADVERTENCIA: Descripción excede límite: ${description.length} > ${MAX_DESCRIPTION_LENGTH}. Considera reducir PLAYERS_PER_PAGE.`
      );
    }

    // Crear embed
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setTimestamp();

    // Solo agregar título si no está vacío
    if (title && title.trim().length > 0) {
      embed.setTitle(title);
    }

    // Agregar imagen si existe
    if (imageUrl) {
      embed.setImage(imageUrl);
    }

    // Footer con información de paginación (formato original)
    let footerText = `📄 Página ${pageNum} de ${totalPages} | 👥 Mostrando jugadores ${
      startIdx + 1
    }-${Math.min(endIdx, totalPlayers)} de ${totalPlayers}`;
    embed.setFooter({ text: footerText });

    // Crear botones de navegación
    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (totalPages > 1) {
      const navRow = new ActionRowBuilder<ButtonBuilder>();

      // Botón "Anterior" - siempre visible, deshabilitado si estamos en la primera página
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`${buttonIdPrefix}_prev_${Math.max(1, pageNum - 1)}`)
          .setLabel('⬅️ Anterior')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageNum === 1)
      );

      // Botón "Siguiente" - siempre visible, deshabilitado si estamos en la última página
      navRow.addComponents(
        new ButtonBuilder()
          .setCustomId(
            `${buttonIdPrefix}_next_${Math.min(totalPages, pageNum + 1)}`
          )
          .setLabel('Siguiente ➡️')
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pageNum === totalPages)
      );

      // Agregar botón cerrar
      navRow.addComponents(...createCloseButtonRow().components);
      components.push(navRow);
    } else {
      // Solo botón cerrar si no hay paginación
      components.push(createCloseButtonRow());
    }

    return {
      embed,
      components,
      page: pageNum,
      totalPages,
      totalPlayers,
    };
  } catch (error) {
    // Log del error con el sistema de logs
    await logApp(
      `[createPlayerPaginationEmbed] ❌ ERROR al generar lista de jugadores: ${error instanceof Error ? error.message : String(error)}`
    );
    await logApp(
      `[createPlayerPaginationEmbed] Stack trace: ${error instanceof Error ? error.stack : 'N/A'}`
    );

    // Retornar un embed de error básico
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
