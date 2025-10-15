import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  Guild,
  GuildMember,
} from 'discord.js';
import { ALL_PLAYERS_EMOGI, MAX_PLAYERS_PER_PAGE } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { getRankEmoji } from '../utils/emoji-helper';
import { getPlayerData } from '../utils/player-data-manager';
import { Player, PlayerRecord } from '../interfaces/player';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { logApp } from '../utils/logger';
import { createPlayerPaginationEmbed } from '../utils/player-pagination-helper';

/**
 * Obtiene todos los jugadores del servidor que tienen algún rol de rango de Apex Legends desde la caché.
 *
 * Utiliza el sistema de mapeo de roles para soportar roles personalizados del servidor.
 * Recorre todos los miembros en caché y verifica si tienen un rol de rango asignado.
 *
 * NOTA: Solo usa miembros en caché para evitar errores de rate limit en servidores grandes.
 * Esta función se usa principalmente para determinar el modo de visualización (normal/paginado)
 * basándose en la cantidad total de jugadores. Para servidores grandes (1000+), la lista
 * paginada usa playerData en lugar del caché para mayor estabilidad.
 *
 * @param guild Servidor de Discord donde buscar los jugadores.
 * @returns Lista de jugadores con su rango asignado encontrados en caché.
 */
export async function getAllRankedPlayers(guild: Guild): Promise<Player[]> {
  await logApp(
    `[getAllRankedPlayers] Obteniendo jugadores en caché para guild ${guild.name} (${guild.id})`
  );
  await logApp(
    `[getAllRankedPlayers] Miembros en caché: ${guild.members.cache.size}`
  );

  const players: Player[] = [];
  // Usar roles mapeados del servidor para soportar roles personalizados
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rankRoleNames = ranks.map((r) => r.roleName);

  guild.members.cache.forEach((member) => {
    const rankRole = member.roles.cache.find((role) =>
      rankRoleNames.includes(role.name)
    );
    if (rankRole) {
      players.push({ member, rankName: rankRole.name });
    }
  });

  await logApp(
    `[getAllRankedPlayers] Se encontraron ${players.length} jugadores con rangos`
  );

  return players;
}

/**
 * Muestra el listado de jugadores registrados agrupados por rango con paginación inteligente.
 *
 * Presenta un embed con los nombres de jugadores y sus fechas de registro,
 * utilizando los roles mapeados del servidor para soportar nombres personalizados.
 *
 * **Modo Normal (< 1000 jugadores):**
 * - Muestra todos los rangos con jugadores agrupados
 * - Genera múltiples embeds si es necesario (máx 10)
 * - Usa caché de Discord para verificar roles
 *
 * **Modo Paginado (≥ 1000 jugadores):**
 * - Lista plana con paginación de 50 jugadores por página
 * - Botones de navegación con setDisabled
 * - Usa playerData para mayor estabilidad
 * - Muestra numeración y fechas de registro
 *
 * @param interaction Interacción de botón o menú de selección de Discord.
 * @param rankShortId ID corto del rango para filtrar (opcional, muestra todos si se omite).
 * @param onlyOnline Si es true, solo muestra jugadores con estado en línea.
 * @param page Número de página actual (inicia en 1, solo para modo paginado).
 */
export async function handleShowAllPlayersMenu(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  rankShortId?: string,
  onlyOnline: boolean = false,
  page: number = 1
) {
  if (!interaction.guild) return;

  // Si es navegación de páginas (prev/next), actualizar el mensaje actual
  const isPageNavigation =
    interaction.customId.startsWith('all_players_prev_') ||
    interaction.customId.startsWith('all_players_next_');

  if (isPageNavigation) {
    await interaction.deferUpdate();
  } else {
    await interaction.deferReply({ ephemeral: true });
  }

  try {
    const [players, playerData] = await Promise.all([
      getAllRankedPlayers(interaction.guild),
      getPlayerData(interaction.guild),
    ]);

    const playerDateById = new Map<string, string>(
      (playerData as PlayerRecord[]).map((p) => [p.userId, p.assignedAt])
    );

    // Obtener rangos mapeados del servidor y filtrar si se especificó un rango
    const allRanks = getApexRanksForGuild(
      interaction.guild.id,
      interaction.guild
    );
    let filteredRanks = allRanks;
    if (rankShortId) {
      filteredRanks = allRanks.filter((r) => r.shortId === rankShortId);
    }
    await logApp(
      `[handleShowAllPlayersMenu] Filtrando con ${filteredRanks.length} rangos`
    );

    // Agrupar jugadores por rango usando roles mapeados
    const playersByRank: Record<string, GuildMember[]> = {};
    for (const rank of filteredRanks) {
      playersByRank[rank.roleName] = [];
    }

    for (const player of players) {
      if (playersByRank[player.rankName]) {
        if (
          !onlyOnline ||
          (player.member.presence && player.member.presence.status === 'online')
        ) {
          playersByRank[player.rankName].push(player.member);
        }
      }
    }

    // Detectar si es un servidor grande (1000+ jugadores registrados)
    const isLargeServer = players.length >= 1000;

    const baseTitle = onlyOnline
      ? 'Filtra los jugadores 🟢 en línea por rango'
      : ALL_PLAYERS_EMOGI + ' Jugadores Registrados por Rango';

    if (isLargeServer) {
      // MODO PAGINADO para servidores grandes usando el helper unificado
      await logApp(
        `[handleShowAllPlayersMenu] Servidor grande detectado (${players.length} jugadores). Usando paginación.`
      );

      // Aplanar la lista de jugadores con su rango
      const allPlayersList: Array<{ member: GuildMember; rank: any }> = [];
      for (const rank of filteredRanks) {
        const membersInRank = playersByRank[rank.roleName];
        membersInRank.forEach((member) => {
          allPlayersList.push({ member, rank });
        });
      }

      // Extraer miembros y crear mapa de rangos por usuario
      const allMembers = allPlayersList.map((item) => item.member);
      const ranksByUser = new Map(
        allPlayersList.map((item) => [item.member.id, item.rank])
      );

      // Usar el helper de paginación unificado
      const paginationResult = await createPlayerPaginationEmbed(
        interaction.guild,
        {
          members: allMembers,
          page: page,
          playersPerPage: MAX_PLAYERS_PER_PAGE,
          buttonIdPrefix: 'all_players',
          color: '#3498db',
          title: baseTitle,
          showNumbers: true,
          showPresence: false,
          showPlatform: true,
          showRoles: false,
          assignedDates: playerDateById,
          showDates: true,
          ranksByUser: ranksByUser,
          showRankEmoji: true,
          useDisplayName: true,
        }
      );

      await interaction.editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });
    } else {
      // MODO NORMAL para servidores pequeños
      const embeds: EmbedBuilder[] = [];
      const MAX_DESCRIPTION_LENGTH = 3900;
      let currentDescription = '';
      let currentEmbed = new EmbedBuilder().setColor('#3498db').setTimestamp();

      for (const rank of filteredRanks) {
        const membersInRank = playersByRank[rank.roleName];
        const emoji = getRankEmoji(interaction.client, rank);

        let rankSection = `\n**${emoji} ${rank.label} (${membersInRank.length})**\n`;

        if (membersInRank.length > 0) {
          const membersList = membersInRank
            .map((m, index) => {
              const assignedAt = playerDateById.get(m.id);
              const dateString = assignedAt
                ? ` - _<t:${Math.floor(
                    new Date(assignedAt).getTime() / 1000
                  )}:D>_`
                : '';
              // TEMPORAL: Mostrar mención + nombre copiable (doble)
              const displayName = m.displayName || 'Usuario';
              return `${index + 1}. <@${m.id}> \`${displayName}\`${dateString}`;
            })
            .join('\n');
          rankSection += membersList;
        } else {
          rankSection += onlyOnline
            ? `_...No hay jugadores registrados en línea en este rango._`
            : `_...No hay jugadores registrados en este rango._`;
        }
        rankSection += '\n';

        if (
          currentDescription.length + rankSection.length >
          MAX_DESCRIPTION_LENGTH
        ) {
          currentEmbed.setDescription(
            currentDescription.trim().length > 0
              ? currentDescription
              : 'No se encontraron jugadores.'
          );
          embeds.push(currentEmbed);

          currentEmbed = new EmbedBuilder().setColor('#3498db').setTimestamp();
          currentDescription = rankSection;
        } else {
          currentDescription += rankSection;
        }
      }

      if (currentDescription.trim().length > 0) {
        currentEmbed.setDescription(currentDescription);
        embeds.push(currentEmbed);
      }

      if (embeds.length === 0) {
        embeds.push(
          new EmbedBuilder()
            .setColor('#3498db')
            .setTitle(baseTitle)
            .setDescription(
              onlyOnline
                ? 'No se encontraron jugadores registrados en línea.'
                : 'No se encontraron jugadores registrados.'
            )
            .setTimestamp()
        );
      }

      if (embeds.length > 1) {
        embeds.forEach((embed, index) => {
          embed.setTitle(`${baseTitle} - Parte ${index + 1}/${embeds.length}`);
        });
      } else {
        embeds[0].setTitle(baseTitle);
      }

      if (embeds.length > 10) {
        await logApp(
          `[handleShowAllPlayersMenu] ADVERTENCIA: Se generaron ${embeds.length} embeds, enviando solo los primeros 10`
        );
        embeds.splice(10);
        embeds[9].setFooter({
          text: '⚠️ Lista truncada por límites de Discord. Usa los filtros por rango para ver más.',
        });
      }

      await interaction.editReply({
        embeds: embeds,
        components: [createCloseButtonRow()],
      });
    }
  } catch (error) {
    await logApp(
      `Error al mostrar lista de jugadores en ${interaction.guild?.name}: ${error}`
    );
    const errorEmbed = new EmbedBuilder()
      .setColor('#e74c3c')
      .setTitle('❌ Error')
      .setDescription(
        'Hubo un error al intentar obtener la lista de jugadores.'
      );
    await interaction.editReply({
      embeds: [errorEmbed],
      components: [createCloseButtonRow()],
    });
  }
}
