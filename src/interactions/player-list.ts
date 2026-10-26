import {
  MessageFlags,
  ButtonInteraction,
  StringSelectMenuInteraction,
  EmbedBuilder,
  GuildMember,
} from 'discord.js';
import { ALL_PLAYERS_EMOGI, MAX_PLAYERS_PER_PAGE } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { getPlayerData } from '../utils/player-data-manager';
import { PlayerRecord } from '../interfaces/player';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { buildRankResolver } from '../helpers/rank-priority';
import { logApp } from '../utils/logger';
import { createPlayerPaginationEmbed } from '../utils/player-pagination-helper';
import { getAllRankedPlayers } from './player-list-ranked';
import { buildNormalRankEmbeds } from './player-list-normal';
import type { ApexRank } from '../interfaces/apex-rank';

export { getAllRankedPlayers };

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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }

  try {
    const allRanks = getApexRanksForGuild(
      interaction.guild.id,
      interaction.guild
    );
    const resolver = buildRankResolver(allRanks);
    const [players, playerData] = await Promise.all([
      getAllRankedPlayers(interaction.guild, resolver),
      getPlayerData(interaction.guild),
    ]);

    const playerDateById = new Map<string, string>(
      (playerData as PlayerRecord[]).map((p) => [p.userId, p.assignedAt])
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
      const allPlayersList: Array<{ member: GuildMember; rank: ApexRank }> = [];
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
      const embeds = await buildNormalRankEmbeds({
        client: interaction.client,
        ranks: filteredRanks,
        playersByRank,
        playerDateById,
        onlyOnline,
        baseTitle,
      });

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
