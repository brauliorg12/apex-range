import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
  Guild,
  GuildMember,
  Role,
} from 'discord.js';
import {
  MAX_PLAYERS_PER_CARD,
  MAX_PLAYERS_PER_PAGE,
} from '../models/constants';
import { renderRankCardCanvas } from './rank-card-canvas';
import { buildOnlineEmbedForRank } from './build-online-embed-rank';
import { createSeeMoreButtonRow } from './online-embed-helper';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import {
  buildRankResolver,
  sortRanksByTier,
} from '../helpers/rank-priority';
import type { ApexRank } from '../interfaces/apex-rank';
import { getServerLogger } from './server-logger';
import {
  getAllMembersByRole,
  getAllMembersByRoleWithProxies,
  sortMembersByPriority,
} from './online-members';

export {
  getAllMembersByRole,
  getAllMembersByRoleWithProxies,
  sortMembersByPriority,
};

/**
 * Genera todos los embeds y archivos de imagen para mostrar los jugadores por
 * rango.
 *
 * Muestra solo la primera página de jugadores del rango y agrega botones de
 * paginación si hay más de una página.
 *
 * @param guild - El servidor de Discord.
 * @param maxPerCard - Máximo de jugadores por card.
 * @param playerDataSnapshot - Snapshot de jugadores ya validado. Si se omite,
 *   los datos se leen desde `player-data-manager`.
 * @param expectedRanks - Lista de rangos ya inspeccionada. Si se proporciona,
 *   se usa tal cual y la función falla si falta el rol de algún rango. Si se
 *   omite, se resuelve el catálogo y se conserva el comportamiento del setup.
 * @returns Los embeds, archivos, componentes y rangos procesados.
 * @throws {Error} Si `expectedRanks` está definido y falta el rol de un rango.
 */
export async function buildAllOnlineEmbeds(
  guild: Guild,
  maxPerCard = MAX_PLAYERS_PER_CARD,
  playerDataSnapshot?: unknown[],
  expectedRanks?: readonly ApexRank[]
) {
  const embeds: EmbedBuilder[] = [];
  const files: (AttachmentBuilder | null)[] = [];
  const componentsList: ActionRowBuilder<ButtonBuilder>[][] = [];
  const cardRanks: ApexRank[] = [];

  let playerData = playerDataSnapshot;
  if (!playerData) {
    const { getPlayerData } = await import('./player-data-manager');
    playerData = await getPlayerData(guild);
  }

  const ranks = sortRanksByTier(
    expectedRanks ?? getApexRanksForGuild(guild.id, guild)
  );
  const resolver = buildRankResolver(ranks);

  for (const rank of ranks) {
    const role: Role | undefined = guild.roles.cache.find(
      (r): r is Role => r.name === rank.roleName
    );
    if (!role) {
      if (expectedRanks !== undefined) {
        throw new Error(
          `No se reconstruyó el panel: falta el rol "${rank.roleName}" ` +
            `del rango "${rank.label}". No se modificó el panel anterior. ` +
            'Revisá los roles y ejecutá /setup-roles.'
        );
      }
      continue;
    }

    const allMembers = getAllMembersByRole(guild, role, playerData, resolver);
    const sortedMembers = sortMembersByPriority(allMembers, playerData);

    const pageMembers = sortedMembers.slice(0, maxPerCard);

    const emojiMatch =
      typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
    let emojiUrl = undefined;
    if (emojiMatch) {
      const emojiId = emojiMatch[1];
      emojiUrl =
        `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
    }

    let cardUrl = undefined;
    let cardAttachment: AttachmentBuilder | undefined;
    if (emojiUrl) {
      const cardBuffer = await renderRankCardCanvas(
        emojiUrl,
        rank.color,
        rank.label
      );
      const cardName = `rankcard_${rank.shortId}.png`;
      cardAttachment = new AttachmentBuilder(cardBuffer, {
        name: cardName,
      });
      cardUrl = `attachment://${cardName}`;
    }

    const embed = await buildOnlineEmbedForRank(
      guild,
      rank,
      pageMembers,
      cardUrl,
      sortedMembers.length,
      1,
      maxPerCard,
      false,
      allMembers as GuildMember[]
    );

    embeds.push(embed);
    files.push(cardAttachment ?? null);
    cardRanks.push(rank);

    const seeMoreRow = createSeeMoreButtonRow(
      rank,
      sortedMembers.length,
      MAX_PLAYERS_PER_PAGE,
      guild.client
    );

    if (seeMoreRow.length) componentsList.push(seeMoreRow);
    else componentsList.push([]);
  }

  if (embeds.length !== ranks.length) {
    getServerLogger(guild.id, guild.name).warn(
      `[build-all-online-embed] Se generaron ${embeds.length} cards, ` +
        `pero hay ${ranks.length} rangos.`
    );
  }

  return { embeds, files, componentsList, ranks: cardRanks };
}
