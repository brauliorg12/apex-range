import {
  Guild,
  AttachmentBuilder,
  Role,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS } from '../models/constants';
import { renderRankCardCanvas } from './rank-card-canvas';
import { getRankEmoji } from './emoji-helper';
import { createCloseButtonRow } from './button-helper';
import { buildOnlineEmbedForRank } from './build-online-embed-rank';
import {
  getAllMembersByRole,
  sortMembersByPriority,
} from './build-all-online-embed';

/**
 * Crea una fila con el botón "Ver más jugadores" solo si hay más jugadores que el máximo por card.
 */
export function createSeeMoreButtonRow(
  rank: (typeof APEX_RANKS)[number],
  totalCount: number,
  maxPerCard: number,
  client: Client
) {
  if (totalCount > maxPerCard) {
    const rankEmoji = getRankEmoji(client, rank) || '🎯';
    return [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`rank_${rank.shortId}_vermas`)
          .setLabel('Ver más')
          .setEmoji(rankEmoji)
          .setStyle(ButtonStyle.Secondary)
      ),
    ];
  }
  return [];
}

/**
 * Crea los botones de paginación para un rango.
 */
export function createPaginationButtons(
  rankId: string,
  currentPage: number,
  totalPages: number
) {
  if (totalPages <= 1) return []; // Devuelve array vacío si no hay paginación

  const row = new ActionRowBuilder<ButtonBuilder>();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_prev`)
      .setLabel('⬅️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage === 1),
    new ButtonBuilder()
      .setCustomId(`rank_${rankId}_next`)
      .setLabel('Siguiente ➡️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(currentPage === totalPages),
    // Boton Cerrar
    ...createCloseButtonRow().components
  );
  return [row];
}

/**
 * Genera el embed, archivos y botones para una página específica de jugadores por rango.
 * Solo retorna un embed por card, respetando el máximo por parámetro.
 */
export async function getRankPageEmbed(
  guild: Guild,
  rankId: string,
  page: number,
  maxPerCard: number,
  showNumbers: boolean = true
) {
  const { getPlayerData } = await import('./player-data-manager');
  const playerData = await getPlayerData(guild);

  const rank = APEX_RANKS.find((r) => r.shortId === rankId);
  if (!rank) return null;

  const role: Role | undefined = guild.roles.cache.find(
    (r): r is Role => r.name === rank.roleName
  );
  if (!role) return null;

  const allMembers = getAllMembersByRole(guild, role, playerData);
  const sortedMembers = sortMembersByPriority(allMembers, playerData);

  const totalPages = Math.ceil(sortedMembers.length / maxPerCard);
  const pageNum = Math.max(1, Math.min(page, totalPages));
  const pageMembers = sortedMembers.slice(
    (pageNum - 1) * maxPerCard,
    pageNum * maxPerCard
  );

  // Obtener URL del emoji grande
  const emojiMatch =
    typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
  let emojiUrl = undefined;
  if (emojiMatch) {
    const emojiId = emojiMatch[1];
    emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
  }

  let cardUrl = undefined;
  const files: AttachmentBuilder[] = [];
  if (emojiUrl) {
    const cardBuffer = await renderRankCardCanvas(
      emojiUrl,
      rank.color,
      rank.label
    );
    const cardName = `rankcard_${rank.shortId}.png`;
    const cardAttachment = new AttachmentBuilder(cardBuffer, {
      name: cardName,
    });
    files.push(cardAttachment);
    cardUrl = `attachment://${cardName}`;
  }

  const embed = await buildOnlineEmbedForRank(
    guild,
    rank,
    pageMembers,
    cardUrl,
    sortedMembers.length, // totalCount
    pageNum, // página actual
    maxPerCard, // máximo por página
    showNumbers, // mostrar numeración en la lista de jugadores (solo para embeds efímeros)
    allMembers as GuildMember[] // <-- aquí pasas todos los miembros del rango
  );

  const totalCount = sortedMembers.length;
  const startIdx = (pageNum - 1) * maxPerCard + 1;
  const endIdx = startIdx + pageMembers.length - 1;

  let footerText = `📄 Página ${pageNum} de ${totalPages} | 👥 Mostrando jugadores ${startIdx}-${endIdx} de ${totalCount}`;
  if (totalPages > 1) {
    footerText += '\n👉 Usa los botones para navegar';
  }
  embed.setFooter({ text: footerText });

  const componentsBtns: ActionRowBuilder<ButtonBuilder>[] =
    totalPages > 1
      ? createPaginationButtons(rank.shortId, pageNum, totalPages)
      : [createCloseButtonRow()];

  // Solo retorna el embed, archivos y botones de la página actual
  return {
    embed,
    files,
    components: componentsBtns,
    page: pageNum,
    totalPages,
  };
}
