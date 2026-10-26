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
import { isUnknownMessageError } from '../utils/message-reference';
import {
  buildCardFingerprint,
  forgetCardFingerprint,
  getCardFingerprint,
  rememberCardFingerprint,
} from './rank-card-fingerprint';
import type { ApexRank } from '../interfaces/apex-rank';
import type { PlayerRecord } from '../interfaces/player';
import type { RankResolver } from './rank-priority';

// Cache global para buffers de cards de rangos
const rankCardCache = new Map<string, Buffer>();

/** Resultado del intento de actualización de un card. */
export type RankCardUpdateResult = 'edited' | 'skipped' | 'unavailable';

/** Datos compartidos para renderizar un card sin releer jugadores. */
export interface RankCardRenderContext {
  /** Snapshot de jugadores del guild. */
  playerData: PlayerRecord[];
  /** Resolvedor canónico de rangos. */
  resolver: RankResolver;
  /** Fuerza la edición aunque el fingerprint coincida. */
  force?: boolean;
}

/**
 * Actualiza solo el mensaje del card de un rango específico en el canal.
 *
 * Omite la edición cuando el contenido visible no cambió, salvo que `force`
 * esté activo. Nunca registra un log por omisión; el agregado lo hace el
 * refresco.
 *
 * @param guild - Servidor Discord.
 * @param channel - Canal donde están los cards.
 * @param rank - Rango a actualizar.
 * @param messageId - El ID del mensaje del card a actualizar.
 * @param context - Snapshot de jugadores, resolvedor y opción de forzar.
 * @returns `edited`, `skipped` o `unavailable`.
 */
export async function updateRankCardMessage(
  guild: Guild,
  channel: TextChannel,
  rank: ApexRank,
  messageId: string,
  context: RankCardRenderContext
): Promise<RankCardUpdateResult> {
  const serverLogger = getServerLogger(guild.id, guild.name);

  const role: Role | undefined = guild.roles.cache.find(
    (r): r is Role => r.name === rank.roleName
  );
  if (!role) {
    serverLogger.warn(
      `Role de Discord no encontrado: ${rank.roleName} para ${rank.shortId}`
    );
    return 'unavailable';
  }

  const allMembers = getAllMembersByRole(
    guild,
    role,
    context.playerData,
    context.resolver
  );
  const sortedMembers = sortMembersByPriority(allMembers, context.playerData);

  const pageMembers = sortedMembers.slice(0, MAX_PLAYERS_PER_CARD);

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
    let cardBuffer = rankCardCache.get(rank.shortId);
    if (!cardBuffer) {
      cardBuffer = await renderRankCardCanvas(emojiUrl, rank.color, rank.label);
      rankCardCache.set(rank.shortId, cardBuffer);
    }

    const cardName = `rankcard_${rank.shortId}.png`;
    files.push(new AttachmentBuilder(cardBuffer, { name: cardName }));
    cardUrl = `attachment://${cardName}`;
  }

  const embed = await buildOnlineEmbedForRank(
    guild,
    rank,
    pageMembers,
    cardUrl,
    sortedMembers.length,
    1,
    MAX_PLAYERS_PER_CARD,
    false,
    allMembers as GuildMember[]
  );

  const components = createSeeMoreButtonRow(
    rank,
    sortedMembers.length,
    MAX_PLAYERS_PER_CARD,
    guild.client
  );
  const fingerprint = buildCardFingerprint(
    messageId,
    embed,
    components,
    files
  );

  if (
    !context.force &&
    getCardFingerprint(guild.id, messageId) === fingerprint
  ) {
    return 'skipped';
  }

  try {
    const msg = await channel.messages.fetch(messageId);
    await msg.edit({
      embeds: [embed],
      files,
      components,
    });

    rememberCardFingerprint(guild.id, messageId, fingerprint);
    return 'edited';
  } catch (error) {
    forgetCardFingerprint(guild.id, messageId);

    if (isUnknownMessageError(error)) {
      serverLogger.warn(
        `El mensaje del card de rango ${rank.shortId} no existe. ` +
          'Ejecuta el comando de setup para restaurar el panel.'
      );
    } else {
      serverLogger.error(
        'Error inesperado al editar el mensaje del card:',
        error
      );
    }

    return 'unavailable';
  }
}
