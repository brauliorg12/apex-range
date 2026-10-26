import { Guild, TextChannel } from 'discord.js';
import { ApexRank } from '../../interfaces/apex-rank';
import { RolesState } from '../../interfaces/bot-state';
import { getPlayerDataSnapshot } from '../../utils/player-data-manager';
import { getServerLogger } from '../../utils/server-logger';
import { forgetRankCardFingerprints } from '../../helpers/rank-card-fingerprint';
import { buildRankPanel } from './rank-panel-builder';
import { collectOldPanelMessageIds } from './rank-panel-cleanup';
import {
  clearRankPanelJournal,
  markRankPanelRebuildInProgress,
  persistRankPanelState,
  updateRankPanelRetiredIds,
} from './rank-panel-journal';
import {
  deletePanelMessages,
  describeError,
} from './rank-panel-deletion';
import { sendRankPanelMessages } from './rank-panel-sender';
import {
  RankPanelMessageIds,
  RankPanelRebuildResult,
} from './rank-panel-types';

/**
 * Reconstruye el panel completo con un cierre transaccional.
 *
 * Envía el panel nuevo antes de borrar el viejo para no dejarlo vacío si falla.
 * Antes de enviar persiste la marca de rebuild y los IDs recolectados; después
 * de enviar persiste los IDs nuevos y los retirados. El borrado se hace de a
 * uno y solo se limpia el journal cuando el borrado se confirma o el mensaje ya
 * no existe.
 *
 * Lee un snapshot estricto de jugadores antes de tocar mensajes. Si el archivo
 * está corrupto o no se puede leer, o si falta un rol de la lista esperada,
 * aborta sin modificar el panel. La comparación de cards se hace antes de
 * enviar, borrar o persistir.
 *
 * @param guild - El servidor de Discord.
 * @param channel - Canal del panel.
 * @param state - Estado persistido del panel.
 * @param expectedRanks - Lista de rangos validada por la inspección.
 * @returns Cantidad de cards y avisos del borrado.
 * @throws {Error} Si el archivo de jugadores no es legible, falta un rol
 *   esperado, la cantidad de cards no coincide con la inspección, o falla el
 *   envío, la persistencia o el journal del panel.
 */
export async function rebuildRankPanel(
  guild: Guild,
  channel: TextChannel,
  state: RolesState | null,
  expectedRanks: readonly ApexRank[]
): Promise<RankPanelRebuildResult> {
  const players = await getPlayerDataSnapshot(guild);
  if (players.status === 'invalid' || players.status === 'io-error') {
    throw new Error(
      `No se reconstruyó el panel: no se pudo leer players_${guild.id}.json ` +
        `(${players.status}): ${players.error}`
    );
  }

  const playerData = players.status === 'ok' ? players.players : [];
  const panel = await buildRankPanel(guild, playerData, expectedRanks);

  if (panel.cards.length !== expectedRanks.length) {
    throw new Error(
      `No se reconstruyó el panel: se generaron ${panel.cards.length} de ` +
        `${expectedRanks.length} cards esperados. No se modificó el panel ` +
        'anterior. Revisá los roles y ejecutá /setup-roles.'
    );
  }

  const logger = getServerLogger(guild.id, guild.name);
  const rebuildStartedAt = performance.now();
  logger.debug(
    `[rank-panel] Rebuild iniciado: cards=${panel.cards.length} ` +
      `esperados=${expectedRanks.length} jugadores=${playerData.length}`
  );

  const collection = await collectOldPanelMessageIds(channel, guild, state);
  const retiredMessageIds = [
    ...new Set([
      ...collection.messageIds,
      ...(state?.rankPanelRetiredMessageIds ?? []),
    ]),
  ];

  logger.debug(
    `[rank-panel] IDs viejos recolectados: estado=${collection.fromState} ` +
      `fallback=${collection.fromFallback} aBorrar=${retiredMessageIds.length}`
  );

  await markRankPanelRebuildInProgress(guild.id, retiredMessageIds);
  logger.debug(
    `[rank-panel] Journal marcado: rebuildEnCurso=true ` +
      `retirados=${retiredMessageIds.length}`
  );

  logger.debug(
    `[rank-panel] Fase envío iniciada: cards=${panel.cards.length}`
  );
  let newMessageIds: RankPanelMessageIds;
  try {
    newMessageIds = await sendRankPanelMessages(channel, panel);
  } catch (error) {
    logger.error(
      `[rank-panel] Fase envío falló; se revirtieron los mensajes nuevos: ` +
        describeError(error)
    );
    throw error;
  }
  logger.debug('[rank-panel] Fase envío completada');

  const newIds = new Set([
    newMessageIds.headerMessageId,
    newMessageIds.managementMessageId,
    ...Object.values(newMessageIds.cardMessageIds),
  ]);
  const retiredIds = retiredMessageIds.filter((id) => !newIds.has(id));

  logger.debug(
    `[rank-panel] Fase persistencia iniciada: retirados=${retiredIds.length}`
  );
  try {
    await persistRankPanelState(guild, channel.id, newMessageIds, {
      retiredMessageIds: retiredIds,
      rebuildInProgress: retiredIds.length > 0,
    });
  } catch (error) {
    logger.error(
      `[rank-panel] Fase persistencia falló; el journal quedó pendiente: ` +
        describeError(error)
    );
    throw error;
  }
  logger.debug('[rank-panel] Fase persistencia completada');
  forgetRankCardFingerprints(guild.id);

  const warnings = [...collection.warnings];
  const totalMs = Math.round(performance.now() - rebuildStartedAt);

  if (retiredIds.length === 0) {
    logger.debug(
      `[rank-panel] Rebuild completado: cards=${panel.cards.length} ` +
        `retirados=0 borrados=0 avisos=${warnings.length} (${totalMs}ms)`
    );
    return { cardCount: panel.cards.length, warnings };
  }

  logger.debug(
    `[rank-panel] Fase borrado iniciada: mensajes=${retiredIds.length}`
  );
  const deletion = await deletePanelMessages(channel, retiredIds);
  warnings.push(...deletion.warnings);

  if (deletion.failedIds.length > 0) {
    await updateRankPanelRetiredIds(guild.id, deletion.failedIds);
  } else {
    await clearRankPanelJournal(guild.id);
  }

  logger.debug(
    `[rank-panel] Fase borrado completada: fallidos=${deletion.failedIds.length} ` +
      `avisos=${deletion.warnings.length}`
  );
  logger.debug(
    `[rank-panel] Rebuild completado: cards=${panel.cards.length} ` +
      `retirados=${retiredIds.length} ` +
      `borrados=${retiredIds.length - deletion.failedIds.length} ` +
      `avisos=${warnings.length} (${totalMs}ms)`
  );

  return {
    cardCount: panel.cards.length,
    warnings,
  };
}
