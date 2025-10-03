import {
  Guild,
  AttachmentBuilder,
  Role,
  TextChannel,
  GuildMember,
} from 'discord.js';
import { MAX_PLAYERS_PER_CARD } from '../models/constants';
import {
  getAllMembersByRole,
  sortMembersByPriority,
} from '../utils/build-all-online-embed';
import { renderRankCardCanvas } from '../utils/rank-card-canvas';
import { buildOnlineEmbedForRank } from '../utils/build-online-embed-rank';
import { createSeeMoreButtonRow } from '../utils/online-embed-helper';
import { getServerLogger } from '../utils/server-logger';
import { getApexRanksForGuild } from './get-apex-ranks-for-guild';

// Cache global para buffers de cards de rangos
const rankCardCache = new Map<string, Buffer>();

// Cache global para embeds de rangos (simple, sin TTL por ahora)
const rankEmbedCache = new Map<string, any>();

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
  const serverLogger = getServerLogger(guild.id, guild.name);
  const startTime = performance.now();
  serverLogger.debug(`Iniciando updateRankCardMessage para ${rankShortId}`);

  // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rank = ranks.find((r) => r.shortId === rankShortId);
  if (!rank) {
    serverLogger.warn(`Rank no encontrado: ${rankShortId}`);
    return;
  }

  const role: Role | undefined = guild.roles.cache.find(
    (r): r is Role => r.name === rank.roleName
  );
  if (!role) {
    serverLogger.warn(`Role de Discord no encontrado: ${rank.roleName} para ${rankShortId}`);
    return;
  }
  
  serverLogger.debug(`Actualizando card para ${rank.label} (${rank.roleName}) - Role ID: ${role.id}`);

  // Obtén todos los jugadores del rango usando playerData
  const { getPlayerData } = await import('../utils/player-data-manager');
  const playerData = await getPlayerData(guild);
  serverLogger.debug(
    `PlayerData obtenido para ${rankShortId}: ${Math.round(
      performance.now() - startTime
    )}ms`
  );

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
    let cardBuffer = rankCardCache.get(rankShortId);
    if (!cardBuffer) {
      cardBuffer = await renderRankCardCanvas(emojiUrl, rank.color, rank.label);
      rankCardCache.set(rankShortId, cardBuffer);
      serverLogger.debug(
        `Imagen generada para ${rankShortId}: ${Math.round(
          performance.now() - startTime
        )}ms`
      );
    } else {
      serverLogger.debug(`Imagen cacheada para ${rankShortId}`);
    }
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
  serverLogger.debug(
    `Embed construido para ${rankShortId}: ${Math.round(
      performance.now() - startTime
    )}ms`
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
    serverLogger.debug(
      `Mensaje editado para ${rankShortId}: ${Math.round(
        performance.now() - startTime
      )}ms`
    );
  } catch (err: any) {
    if (err.code === 10008) {
      serverLogger.warn(
        `El mensaje del card de rango ${rankShortId} no existe. Ejecuta el comando de setup para restaurar el panel.`
      );
      return; // No recrea el mensaje, solo advierte
    } else {
      serverLogger.error(
        `Error inesperado al editar el mensaje del card:`,
        err
      );
    }
  }
}
