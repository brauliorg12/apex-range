import {
  Guild,
  AttachmentBuilder,
  Role,
  TextChannel,
  GuildMember,
} from 'discord.js';
import { APEX_RANKS, MAX_PLAYERS_PER_CARD } from '../models/constants';
import {
  getAllMembersByRole,
  sortMembersByPriority,
} from '../utils/build-all-online-embed';
import { renderRankCardCanvas } from '../utils/rank-card-canvas';
import { buildOnlineEmbedForRank } from '../utils/build-online-embed-rank';
import { createSeeMoreButtonRow } from '../utils/online-embed-helper';

/**
 * Actualiza solo el mensaje del card de un rango específico en el canal.
 * @param guild Servidor Discord.
 * @param channel Canal donde están los cards.
 * @param rankShortId El shortId del rango a actualizar.
 * @param messageId El ID del mensaje del card a actualizar.
 */
export async function updateRankCardMessage(
  guild: Guild,
  channel: TextChannel,
  rankShortId: string,
  messageId: string
) {
  const rank = APEX_RANKS.find((r) => r.shortId === rankShortId);
  if (!rank) return;

  const role: Role | undefined = guild.roles.cache.find(
    (r): r is Role => r.name === rank.roleName
  );
  if (!role) return;

  // Obtén todos los jugadores del rango usando playerData
  const { getPlayerData } = await import('../utils/player-data-manager');
  const playerData = await getPlayerData(guild);

  const allMembers = getAllMembersByRole(guild, role, playerData);
  const sortedMembers = sortMembersByPriority(allMembers, playerData);

  const pageMembers = sortedMembers.slice(0, MAX_PLAYERS_PER_CARD);

  // Obtener URL del emoji grande
  const emojiMatch =
    typeof rank.id === 'string' && rank.id.match(/^<a?:\w+:(\d+)>$/);
  let emojiUrl = undefined;
  if (emojiMatch) {
    const emojiId = emojiMatch[1];
    emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.png?size=96&quality=lossless`;
  }

  // Genera la imagen (solo logo pulse + texto de rango)
  let cardUrl = undefined;
  let files: AttachmentBuilder[] = [];
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
    sortedMembers.length, // totalCount para el footer
    1, // página actual (puedes ajustar si tienes paginación)
    MAX_PLAYERS_PER_CARD,
    false, // showNumbers (solo true en efímeros)
    allMembers as GuildMember[] // <-- aquí pasas todos los miembros del rango
  );

  // Edita el mensaje del card
  try {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({
      embeds: [embed],
      files,
      components: createSeeMoreButtonRow(
        rank,
        sortedMembers.length,
        MAX_PLAYERS_PER_CARD,
        guild.client
      ),
    });
  } catch (err) {
    console.error(
      `[updateRankCardMessage] No se pudo editar el mensaje del card:`,
      err
    );
  }
}
