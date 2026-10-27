import { Guild, TextChannel } from 'discord.js';
import type { GuildMember } from 'discord.js';
import { buildRankMemberIndex } from '../utils/online-members';
import {
  buildPlayerLookup,
  getPlayerDataSnapshot,
} from '../utils/player-data-manager';
import type { PlayerLookup } from '../utils/player-data-manager';
import { buildPlatformIconByApiName } from './get-apex-platforms-for-guild';
import { readRolesState } from '../utils/state-manager';
import { getServerLogger } from '../utils/server-logger';
import { isUnknownMessageError } from '../utils/message-reference';
import { getApexRanksForGuild } from './get-apex-ranks-for-guild';
import { buildRankResolver } from './rank-priority';
import { updateRankCardMessage } from './update-rank-card-message';
import type { ApexRank } from '../interfaces/apex-rank';
import type { RolesState } from '../interfaces/bot-state';
import type { PlayerRecord } from '../interfaces/player';
import type { RankResolver } from './rank-priority';

/** Datos compartidos por un refresco de cards de rangos. */
export interface RankCardRefreshContext {
  /** Estado de roles leído una sola vez. */
  rolesState: RolesState;
  /** Canal del panel resuelto una sola vez. */
  channel: TextChannel;
  /** Snapshot de jugadores usado por todos los cards. */
  playerData: PlayerRecord[];
  /** Miembros agrupados por el rol de su rango más alto. */
  membersByRank: ReadonlyMap<string, GuildMember[]>;
  /** Catálogo indexado por shortId. */
  rankByShortId: Map<string, ApexRank>;
  /** Resolvedor canónico de rangos. */
  resolver: RankResolver;
  /** Plataformas, fechas e íconos precomputados para todos los cards. */
  lookup: PlayerLookup;
}

/**
 * Prepara los datos necesarios para refrescar cards con una sola lectura de
 * estado y un solo snapshot de jugadores.
 *
 * Si falta el canal o el archivo de jugadores no es válido, devuelve `null`.
 *
 * @param guild - Servidor de Discord.
 * @param rolesState - Estado ya leído, si el llamador lo tiene.
 * @param channel - Canal ya resuelto, si el llamador lo tiene.
 * @returns El contexto listo para usar o `null` si no se puede refrescar.
 */
export async function loadRankCardRefreshContext(
  guild: Guild,
  rolesState?: RolesState | null,
  channel?: TextChannel
): Promise<RankCardRefreshContext | null> {
  const state = rolesState ?? (await readRolesState(guild.id));
  if (!state?.channelId) return null;

  let targetChannel: TextChannel;
  if (channel) {
    targetChannel = channel;
  } else {
    try {
      targetChannel = (await guild.channels.fetch(state.channelId)) as TextChannel;
    } catch (error) {
      getServerLogger(guild.id, guild.name).warn(
        `[rank-card-refresh] No se pudo obtener el canal ${state.channelId}:`,
        error
      );
      return null;
    }
  }

  const snapshot = await getPlayerDataSnapshot(guild);
  if (snapshot.status === 'invalid' || snapshot.status === 'io-error') {
    getServerLogger(guild.id, guild.name).warn(
      `[rank-card-refresh] No se actualizaron los cards: ` +
        `players_${guild.id}.json ${snapshot.status}: ${snapshot.error}`
    );
    return null;
  }

  const playerData = snapshot.status === 'ok' ? (snapshot.players as PlayerRecord[]) : [];
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rankByShortId = new Map(ranks.map((rank) => [rank.shortId, rank] as const));
  const resolver = buildRankResolver(ranks);
  const lookup: PlayerLookup = {
    ...buildPlayerLookup(playerData),
    platformIconByApiName: buildPlatformIconByApiName(guild.id, guild),
  };
  const membersByRank = buildRankMemberIndex(guild, playerData, resolver, { ranks })
    .cachedByRank;

  return {
    rolesState: state,
    channel: targetChannel,
    playerData,
    membersByRank,
    rankByShortId,
    resolver,
    lookup,
  };
}

/**
 * Refresca los cards indicados usando un contexto ya preparado.
 *
 * Sin `rankShortIds` refresca todos los cards. No registra logs por card; deja
 * un único contador agregado por actualización y advierte/registra solo errores.
 *
 * @param guild - Servidor de Discord.
 * @param context - Datos compartidos del refresco.
 * @param rankShortIds - Rangos afectados; si se omite, todos.
 * @param force - Fuerza la edición aunque el fingerprint coincida.
 */
export async function refreshRankCards(
  guild: Guild,
  context: RankCardRefreshContext,
  rankShortIds?: Iterable<string>,
  force: boolean = false
): Promise<void> {
  const messageIds = context.rolesState.rankCardMessageIds;
  if (!messageIds) return;

  const targets =
    rankShortIds === undefined
      ? Array.from(context.rankByShortId.values())
      : Array.from(new Set(rankShortIds))
          .map((shortId) => context.rankByShortId.get(shortId))
          .filter((rank): rank is ApexRank => rank !== undefined);

  const logger = getServerLogger(guild.id, guild.name);
  let edited = 0;
  let skipped = 0;

  for (const rank of targets) {
    const messageId = messageIds[rank.shortId];
    if (!messageId) continue;

    try {
      const result = await updateRankCardMessage(
        guild,
        context.channel,
        rank,
        messageId,
        {
          playerData: context.playerData,
          membersByRank: context.membersByRank,
          resolver: context.resolver,
          lookup: context.lookup,
          force,
        }
      );

      if (result === 'edited') {
        edited++;
      } else if (result === 'skipped') {
        skipped++;
      }
    } catch (error) {
      if (isUnknownMessageError(error)) {
        logger.warn(
          `[rank-card-refresh] El card ${rank.shortId} no existe. ` +
            'Ejecutá el setup para restaurar el panel.'
        );
      } else {
        logger.error(
          `[rank-card-refresh] Error al actualizar el card ${rank.shortId}:`,
          error
        );
      }
    }
  }

  if (edited + skipped > 0) {
    logger.debug(
      `[rank-card-refresh] cards=${edited + skipped} ` +
        `editados=${edited} omitidos=${skipped}`
    );
  }
}

/**
 * Refresca los cards de un guild leyendo estado y jugadores una sola vez.
 *
 * @param guild - Servidor de Discord.
 * @param rankShortIds - Rangos afectados; si se omite, todos.
 * @param force - Fuerza la edición aunque el fingerprint coincida.
 */
export async function refreshRankCardsForGuild(
  guild: Guild,
  rankShortIds?: Iterable<string>,
  force: boolean = false
): Promise<void> {
  const context = await loadRankCardRefreshContext(guild);
  if (!context) return;

  await refreshRankCards(guild, context, rankShortIds, force);
}
