import { Guild, TextChannel } from 'discord.js';
import { readRolesStateStrict } from '../../utils/state-manager';
import { notifyCorruptStateAlert } from '../../utils/admin-alert';
import { getServerLogger } from '../../utils/server-logger';
import { inspectGuildRanks } from './rank-catalog';
import { detectRankRoleCandidates, ensureRankRoles } from './rank-roles';
import {
  hasPendingRankPanelRecovery,
  rebuildRankPanel,
  recoverRankPanelState,
} from './rank-panel';
import { notifyRankSync } from './rank-notify';
import {
  applyCandidateDetection,
  applyProvisionOutcome,
  applyProvisionResult,
  buildPlayerSyncErrorMessage,
  collectAmbiguityWarnings,
  createRankSyncReport,
} from './rank-sync-report';
import { createRankSyncQueue, RankSyncOptions } from './rank-sync-queue';

export type { RankSyncOptions } from './rank-sync-queue';

// #region Canal del panel

/**
 * Resuelve el canal del panel desde la caché o la API de Discord.
 *
 * @param guild - Guild al que pertenece el canal.
 * @param channelId - ID del canal configurado.
 * @returns El canal de texto o `null` si no existe o no es un `TextChannel`.
 */
async function fetchPanelChannel(
  guild: Guild,
  channelId: string
): Promise<TextChannel | null> {
  const channel =
    guild.channels.cache.get(channelId) ??
    (await guild.channels.fetch(channelId).catch(() => null));

  return channel instanceof TextChannel ? channel : null;
}

// #endregion

// #region Orquestación

/**
 * Sincroniza catálogo, roles y panel de una guild.
 *
 * Si la sincronización de jugadores previa falló, no toca el panel ni los
 * roles y reporta el error para no publicar un panel basado en datos inválidos.
 * Si `.bot-state` falta, omite el guild; si es inválido o ilegible, aborta sin
 * tocar el panel y alerta al administrador de la app.
 * Reporta roles ambiguos sin crear, renombrar ni borrar roles.
 * No escribe players_*.json ni server-config.
 *
 * @param guild - Guild a sincronizar.
 * @param options - Opciones de la ejecución.
 */
export async function syncGuildRanks(
  guild: Guild,
  options: RankSyncOptions
): Promise<void> {
  const logger = getServerLogger(guild.id, guild.name);
  if (!rankSyncQueue.begin(guild, options)) return;
  const report = createRankSyncReport(options.reason);

  try {
    const stateResult = await readRolesStateStrict(guild.id);
    if (stateResult.status === 'missing') {
      logger.debug('[rank-sync] Guild sin configuración; omitido.');
      return;
    }

    if (stateResult.status !== 'ok') {
      const stateProblem =
        stateResult.status === 'invalid' ? 'corrupto' : 'ilegible';
      logger.error(
        `[rank-sync] Estado de guild ${stateProblem}; se omite la ` +
          `reconstrucción y el panel anterior queda intacto: ${stateResult.error}`
      );
      await notifyCorruptStateAlert({
        guildId: guild.id,
        guildName: guild.name,
        errorType: stateResult.status,
      });
      return;
    }

    const state = stateResult.state;
    if (options.playerSyncError) {
      report.errors.push(buildPlayerSyncErrorMessage(options.playerSyncError));
      logger.error(
        '[rank-sync] Panel omitido por fallo de sincronización de jugadores:',
        options.playerSyncError
      );
      await notifyRankSync(guild, report);
      return;
    }
    if (!state.channelId) {
      report.errors.push('El estado del guild no tiene canal de panel.');
      await notifyRankSync(guild, report);
      return;
    }
    const inspection = inspectGuildRanks(guild, state);
    logger.debug(
      `[rank-sync] Inspección: motivos=${inspection.reasons.join(',') || 'ninguno'} ` +
        `faltanRoles=${inspection.missingRoles.length} ` +
        `faltanCards=${inspection.missingCards.length} ` +
        `cardsObsoletas=${inspection.obsoleteCardKeys.length} ` +
        `ambiguos=${inspection.ambiguousRoles.length}`
    );

    if (inspection.ambiguousRoles.length > 0) {
      const ambiguityWarnings = collectAmbiguityWarnings(
        inspection.ambiguousRoles
      );
      report.warnings.push(...ambiguityWarnings);
      for (const warning of ambiguityWarnings) {
        logger.warn(`[rank-sync] ${warning}`);
      }
    }
    const hasPendingRecovery = hasPendingRankPanelRecovery(state);

    if (!inspection.needsSync && !hasPendingRecovery) {
      logger.debug(
        '[rank-sync] Sin cambios en panel o roles; no se reconstruye.'
      );
      if (report.warnings.length > 0) {
        await notifyRankSync(guild, report);
      }
      return;
    }

    const channel = await fetchPanelChannel(guild, state.channelId);
    if (!channel) {
      report.errors.push(`Canal del panel no encontrado: ${state.channelId}`);
      await notifyRankSync(guild, report);
      return;
    }

    if (hasPendingRecovery) {
      const recovery = await recoverRankPanelState(guild, channel, state);
      report.warnings.push(...recovery.warnings);

      if (!inspection.needsSync && !recovery.rebuildRequired) {
        logger.debug(
          '[rank-sync] Limpieza de recuperación completada sin rebuild.'
        );
        if (report.warnings.length > 0) {
          await notifyRankSync(guild, report);
        }
        return;
      }
    }

    let expectedRanks = inspection.ranks;

    if (inspection.missingRoles.length > 0) {
      if (options.createMissingRoles === false) {
        const existingRoleNames = guild.roles.cache.map((role) => role.name);
        const detection = detectRankRoleCandidates(
          existingRoleNames,
          inspection.missingRoles,
          inspection.ranks
        );
        applyCandidateDetection(report, detection);
        await notifyRankSync(guild, report);
        return;
      }

      const provision = await ensureRankRoles(
        guild,
        inspection.missingRoles,
        inspection.ranks
      );
      applyProvisionResult(report, provision);

      if (provision.failed.length > 0) {
        await notifyRankSync(guild, report);
        return;
      }

      const refreshed = inspectGuildRanks(guild, state);
      expectedRanks = refreshed.ranks;

      if (applyProvisionOutcome(report, provision, refreshed)) {
        await notifyRankSync(guild, report);
        return;
      }
    }

    const result = await rebuildRankPanel(
      guild,
      channel,
      state,
      expectedRanks
    );
    report.panelUpdated = true;
    report.cardCount = result.cardCount;
    report.warnings.push(...result.warnings);

    logger.info(
      `[rank-sync] Panel reconstruido con ${result.cardCount} cards ` +
        `(${report.createdRoles.length} roles creados).`
    );
    await notifyRankSync(guild, report);
  } catch (error) {
    report.errors.push(error instanceof Error ? error.message : String(error));
    logger.error('[rank-sync] Error durante la sincronización:', error);
    await notifyRankSync(guild, report);
  } finally {
    rankSyncQueue.finish(guild);
  }
}

// #endregion

// #region API pública

const rankSyncQueue = createRankSyncQueue(syncGuildRanks);

/**
 * Encola una sincronización por guild.
 * La cola es serial para no saturar una VM pequeña.
 *
 * @param guild - Guild a sincronizar.
 * @param options - Opciones de la ejecución.
 */
export function enqueueRankSync(
  guild: Guild,
  options: RankSyncOptions
): void {
  rankSyncQueue.enqueue(guild, options);
}

/**
 * Libera estado en memoria de una guild eliminada.
 * No interrumpe una ejecución en curso; su `finish` limpia el lock.
 *
 * @param guildId - ID de la guild que se removió.
 */
export function forgetRankSyncState(guildId: string): void {
  rankSyncQueue.forget(guildId);
}

// #endregion
