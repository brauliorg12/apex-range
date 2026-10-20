import type { Guild } from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import { readApexStatusState } from '../utils/state-manager';
import { createApexStatusEmbeds } from '../utils/apex-status-embed';
import { createApexStatusComponents } from '../utils/apex-status-components';
import { fetchApexChannel } from './apex-panel/channel';
import { MAX_RECOVERY_ATTEMPTS } from './apex-panel/constants';
import { withApexPanelLock } from './apex-panel/lock';
import { handleEditError, recreatePanel } from './apex-panel/panel';
import {
  getAttemptsInWindow,
  getBackoffMs,
  suspendRecovery,
} from './apex-panel/recovery';
import {
  cleanupDuplicateApexPanels,
  findExistingApexPanel,
  maybeCleanupDuplicateApexPanels,
} from './apex-panel/search';
import {
  persistApexState,
  rememberApexPanelMessage,
  resolveApexPanelState,
} from './apex-panel/state';
import type { StateWithGuild } from './apex-panel/types';

export { withApexPanelLock } from './apex-panel/lock';
export { rememberApexPanelMessage } from './apex-panel/state';
export {
  cleanupDuplicateApexPanels,
  deletePreviousApexPanel,
} from './apex-panel/search';
export { notifyApexPanelCommand } from './apex-panel/notifications';
export { clearApexPanelMemory } from './apex-panel/memory';

/**
 * Actualiza el panel de Apex respetando el lock por guild.
 *
 * @param guild Guild de Discord donde se actualiza el panel.
 */
export function updateApexInfoMessage(guild: Guild): Promise<void> {
  return withApexPanelLock(guild.id, () =>
    performUpdateApexInfoMessage(guild)
  );
}

/**
 * Flujo principal de actualizacion del panel de Apex.
 *
 * - Lee el estado del guild (canal y mensaje).
 * - Respeta suspensiones, intentos maximos y backoff.
 * - Si no hay mensaje registrado, recupera un panel existente o lo recrea.
 * - Si el mensaje fue eliminado (`10008`), lo recrea y guarda el nuevo ID.
 * - Notifica al canal de control o al owner como alternativa.
 *
 * @param guild Guild de Discord donde se actualiza el panel.
 */
async function performUpdateApexInfoMessage(guild: Guild): Promise<void> {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);
  serverLogger.info('Iniciando actualización del mensaje de Apex');

  try {
    const apexStatusState = await readApexStatusState(guild.id);
    serverLogger.debug('Estado de Apex leído', apexStatusState);

    const resolved = resolveApexPanelState(guild, apexStatusState);
    if (!resolved) {
      serverLogger.info(
        'No hay estado válido para actualizar Apex en este servidor'
      );
      return;
    }

    const {
      baseState,
      effectiveState,
      channelId,
      knownMessageId,
      hasFreshMemoryPanel,
    } = resolved;

    const now = Date.now();

    if (
      !hasFreshMemoryPanel &&
      effectiveState.recoverySuspendedUntil &&
      effectiveState.recoverySuspendedUntil > now
    ) {
      serverLogger.debug(
        `Recuperación de Apex suspendida hasta ${new Date(
          effectiveState.recoverySuspendedUntil
        ).toISOString()}`
      );
      return;
    }

    const channel = await fetchApexChannel(
      guild,
      channelId,
      effectiveState,
      serverLogger
    );
    if (!channel) return;

    const previousAttempts = hasFreshMemoryPanel
      ? 0
      : getAttemptsInWindow(effectiveState, now);

    if (previousAttempts >= MAX_RECOVERY_ATTEMPTS) {
      await suspendRecovery(
        guild,
        channel,
        effectiveState,
        serverLogger,
        'recovery_suspended',
        `Se alcanzó el máximo de ${MAX_RECOVERY_ATTEMPTS} intentos.`
      );
      return;
    }

    const backoff = getBackoffMs(previousAttempts);
    if (
      previousAttempts > 0 &&
      effectiveState.lastRecoveryAt &&
      now - effectiveState.lastRecoveryAt < backoff
    ) {
      serverLogger.debug(
        `Recuperación de Apex en espera (${Math.round(
          backoff / 60000
        )} min) por backoff`
      );
      return;
    }

    const embeds = await createApexStatusEmbeds(
      effectiveState.guildId,
      channelId
    );
    serverLogger.debug(`Embeds de Apex creados: ${embeds.length}`);

    // El ID confirmado en memoria tiene prioridad sobre el persistido.
    let currentMessageId =
      knownMessageId ?? effectiveState.apexInfoMessageId;

    if (currentMessageId) {
      rememberApexPanelMessage(guild.id, currentMessageId, channel.id);
    } else {
      const existingMessageId = await findExistingApexPanel(
        channel,
        guild.client.user?.id
      );

      if (existingMessageId) {
        currentMessageId = existingMessageId;
        rememberApexPanelMessage(guild.id, existingMessageId, channel.id);

        const recoveredState: StateWithGuild = {
          ...effectiveState,
          apexInfoMessageId: existingMessageId,
          recoveryAttempts: 0,
          lastRecoveryAt: undefined,
          recoverySuspendedUntil: undefined,
        };
        await persistApexState(guild, recoveredState, serverLogger);
        serverLogger.info(
          `Panel de Apex existente recuperado y registrado: ${existingMessageId}`
        );
        await cleanupDuplicateApexPanels(
          channel,
          existingMessageId,
          guild.client.user?.id,
          serverLogger
        );
      }
    }

    if (!currentMessageId) {
      serverLogger.warn(
        'Panel de Apex sin mensaje registrado; se creará uno nuevo'
      );
      await recreatePanel(
        guild,
        channel,
        effectiveState,
        embeds,
        serverLogger
      );
      return;
    }

    const stateNeedsSync =
      baseState.apexInfoMessageId !== currentMessageId ||
      hasFreshMemoryPanel;

    try {
      await channel.messages.edit(currentMessageId, {
        embeds,
        components: createApexStatusComponents(),
      });
      serverLogger.info('Mensaje de Apex editado exitosamente');

      const needsStateWrite =
        stateNeedsSync ||
        !!effectiveState.recoveryAttempts ||
        !!effectiveState.recoverySuspendedUntil ||
        !!effectiveState.lastRecoveryAt;

      if (needsStateWrite) {
        await persistApexState(
          guild,
          {
            ...effectiveState,
            apexInfoMessageId: currentMessageId,
            recoveryAttempts: 0,
            lastRecoveryAt: undefined,
            recoverySuspendedUntil: undefined,
          },
          serverLogger
        );
      }

      await maybeCleanupDuplicateApexPanels(
        guild.id,
        channel,
        currentMessageId,
        guild.client.user?.id,
        serverLogger
      );
    } catch (error: any) {
      await handleEditError(
        guild,
        channel,
        effectiveState,
        embeds,
        error,
        serverLogger
      );
    }
  } catch (error) {
    serverLogger.error(
      'Error general al actualizar el mensaje de Apex',
      error
    );
  } finally {
    const executionTime = Math.round(performance.now() - startTime);
    serverLogger.info(
      'Actualización del mensaje de Apex completada',
      executionTime
    );
  }
}
