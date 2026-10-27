import {
  MessageFlags,
  ButtonInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import type { GuildMember } from 'discord.js';
import {
  buildPlayerLookup,
  getPlayerData,
} from '../utils/player-data-manager';
import { buildPlatformIconByApiName } from '../helpers/get-apex-platforms-for-guild';
import { createPlayerPaginationEmbed } from '../utils/player-pagination-helper';
import { MAX_PLAYERS_PER_PAGE } from '../models/constants';
import { createCloseButtonRow } from '../utils/button-helper';
import { logApp } from '../utils/logger';
import { MIN_QUERY_LENGTH } from './player-search-modal';
import { recoverSearchQuery } from './player-search-navigation';
import { storeQueryForMessage } from './player-search-query-cache';
import type { ApexRank } from '../interfaces/apex-rank';

export { handleOpenPlayerSearchModal } from './player-search-modal';

/**
 * Procesa el modal o la navegación de páginas del buscador de jugadores.
 *
 * Busca coincidencias por nombre visible en la caché de miembros y muestra los
 * resultados con la paginación unificada. En navegación recupera la query desde
 * la caché del mensaje o desde el título del embed.
 *
 * @param interaction - Interacción del modal o del botón de navegación.
 * @param query - Texto buscado; se extrae de la interacción si se omite.
 * @param page - Página solicitada, empezando en 1.
 */
export async function handlePlayerSearchResults(
  interaction: ModalSubmitInteraction | ButtonInteraction,
  query?: string,
  page: number = 1
): Promise<void> {
  try {
    let isPageNavigation = false;
    if (!(interaction as ModalSubmitInteraction).fields) {
      const bi = interaction as ButtonInteraction;
      isPageNavigation =
        bi.customId.startsWith('player_search_prev_') ||
        bi.customId.startsWith('player_search_next_');
    }

    if ((interaction as ModalSubmitInteraction).fields) {
      const modal = interaction as ModalSubmitInteraction;
      await modal.deferReply({ flags: MessageFlags.Ephemeral });
      query = modal.fields.getTextInputValue('player_search_query');
    } else if (isPageNavigation) {
      const bi = interaction as ButtonInteraction;
      await bi.deferUpdate();
      query = recoverSearchQuery(bi) ?? query;
    }

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      const replyTarget = interaction as ModalSubmitInteraction;
      if (replyTarget.fields) {
        await replyTarget.editReply({
          content: `La búsqueda debe tener al menos ${MIN_QUERY_LENGTH} caracteres.`,
          components: [createCloseButtonRow()],
        });
      }
      return;
    }

    const guild = interaction.guild;
    if (!guild) return;

    await logApp(`[player-search] Buscando '${query}' en guild ${guild.id}`);

    const playerData = await getPlayerData(guild);

    const cacheMatches = guild.members.cache.filter((member) =>
      member.displayName.toLowerCase().includes(query!.toLowerCase())
    );

    const dataMatches = playerData.filter((player) => {
      const member = guild.members.cache.get(player.userId);
      if (!member) return false;
      return member.displayName.toLowerCase().includes(query!.toLowerCase());
    });

    const membersMap = new Map<string, GuildMember>();
    cacheMatches.forEach((member) => membersMap.set(member.id, member));
    dataMatches.forEach((player) => {
      const member = guild.members.cache.get(player.userId);
      if (member) membersMap.set(member.id, member);
    });

    const members = Array.from(membersMap.values());

    if (members.length === 0) {
      if ((interaction as ModalSubmitInteraction).fields) {
        await (interaction as ModalSubmitInteraction).editReply({
          content: `No se encontraron resultados para **${query}**.`,
          components: [createCloseButtonRow()],
        });
      } else {
        await (interaction as ButtonInteraction).editReply({
          content: `No se encontraron resultados para **${query}**.`,
          embeds: [],
          components: [createCloseButtonRow()],
        });
      }
      return;
    }

    const lookup = buildPlayerLookup(playerData);
    const platformIconByApiName = buildPlatformIconByApiName(
      guild.id,
      guild
    );
    const assignedDates = new Map(
      playerData.map((player) => [player.userId, player.assignedAt])
    );
    const ranksByUser = new Map<string, ApexRank>();

    const paginationResult = await createPlayerPaginationEmbed(guild, {
      members,
      page,
      playersPerPage: MAX_PLAYERS_PER_PAGE,
      buttonIdPrefix: 'player_search',
      color: '#2ecc71',
      title: `Resultados de búsqueda: ${query}`,
      showNumbers: true,
      showPresence: true,
      showPlatform: true,
      showRoles: false,
      assignedDates,
      showDates: true,
      ranksByUser,
      showRankEmoji: false,
      useDisplayName: true,
      platformByUserId: lookup.platformByUserId,
      platformIconByApiName,
    });

    if ((interaction as ModalSubmitInteraction).fields) {
      const sent = await (interaction as ModalSubmitInteraction).editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });

      try {
        if (sent && sent.id) {
          storeQueryForMessage(sent.id, query!);
        }
      } catch {
        // Ignorar fallos al guardar la caché.
      }
    } else {
      const sent = await (interaction as ButtonInteraction).editReply({
        embeds: [paginationResult.embed],
        components: paginationResult.components,
      });

      try {
        if (sent && sent.id) {
          storeQueryForMessage(sent.id, query!);
        }
      } catch {
        // Ignorar fallos al guardar la caché.
      }
    }
  } catch (error) {
    const stack = error instanceof Error ? error.stack : String(error);
    await logApp(`[player-search] Error procesando búsqueda: ${stack}`);
    try {
      if ((interaction as ModalSubmitInteraction).fields) {
        await (interaction as ModalSubmitInteraction).editReply({
          content: 'Error al procesar la búsqueda.',
          components: [createCloseButtonRow()],
        });
      } else if (!interaction.replied && !interaction.deferred) {
        await (interaction as ButtonInteraction).reply({
          content: 'Error al procesar la navegación de la búsqueda.',
          flags: MessageFlags.Ephemeral,
        });
      }
    } catch {
      // Ignorar fallos al responder el error.
    }
  }
}

export default {};
