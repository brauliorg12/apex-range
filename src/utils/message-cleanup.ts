import { readRolesState, updateRolesState } from './state-manager';
import type { GuildStateFile } from './state-manager';
import { logApp } from './logger';
import {
  checkMessageReference,
  describeError,
  isUnknownChannelError,
} from './message-reference';
import type { MessageFetcherChannel } from './message-reference';

// #region Helpers

/**
 * Limpia todas las referencias del estado cuando el canal ya no existe.
 *
 * @param guildId - ID del guild.
 * @param state - Estado leído antes de detectar el canal inexistente.
 * @throws {Error} Si falla la escritura del estado.
 */
async function clearMissingChannelState(
  guildId: string,
  state: GuildStateFile
): Promise<void> {
  await logApp(
    `[Cleanup] El canal ${state.channelId} no existe; se limpian las ` +
      'referencias del panel.'
  );

  await updateRolesState(guildId, () => ({
    channelId: undefined,
    roleSelectionMessageId: undefined,
    roleCountMessageId: undefined,
    rankCardMessageIds: undefined,
    rankPanelHeaderMessageId: undefined,
    rankPanelManagementMessageId: undefined,
    rankPanelRebuildInProgress: undefined,
    rankPanelRetiredMessageIds: undefined,
  }));
}

// #endregion

// #region Limpieza

/**
 * Limpia referencias a mensajes inexistentes del estado de un servidor.
 *
 * Verifica si los mensajes aún existen y elimina solo las referencias que
 * Discord confirma como inexistentes. Ante rate limits, errores de red o
 * permisos transitorios, conserva las referencias y registra un warning.
 *
 * La escritura es parcial: solo reemplaza los campos limpiados y preserva el
 * resto del estado del guild.
 *
 * @param guildId - ID del guild.
 * @param client - Cliente de Discord usado para resolver el canal.
 */
export async function cleanupInvalidMessageReferences(
  guildId: string,
  client: any
): Promise<void> {
  try {
    const state = await readRolesState(guildId);
    if (!state || !state.channelId) return;

    let fetchedChannel: unknown;
    try {
      fetchedChannel = await client.channels.fetch(state.channelId);
    } catch (error) {
      if (isUnknownChannelError(error)) {
        await clearMissingChannelState(guildId, state);
        return;
      }

      await logApp(
        `[Cleanup][WARN] No se pudo verificar el canal ${state.channelId}; ` +
          `se conservan las referencias: ${describeError(error)}`
      );
      return;
    }

    if (!fetchedChannel) {
      await clearMissingChannelState(guildId, state);
      return;
    }

    if (
      typeof fetchedChannel !== 'object' ||
      !('messages' in fetchedChannel)
    ) {
      await logApp(
        `[Cleanup][WARN] El canal ${state.channelId} no admite mensajes; se ` +
          'conservan las referencias.'
      );
      return;
    }

    const channel = fetchedChannel as MessageFetcherChannel;
    const changes: Partial<GuildStateFile> = {};

    // Verificar mensaje de selección de roles
    if (state.roleSelectionMessageId) {
      const status = await checkMessageReference(
        channel,
        state.roleSelectionMessageId,
        'el mensaje de selección de roles'
      );
      if (status === 'channel-missing') {
        await clearMissingChannelState(guildId, state);
        return;
      }
      if (status === 'missing') {
        changes.roleSelectionMessageId = undefined;
      }
    }

    // Verificar mensaje de estadísticas
    if (state.roleCountMessageId) {
      const status = await checkMessageReference(
        channel,
        state.roleCountMessageId,
        'el mensaje de estadísticas'
      );
      if (status === 'channel-missing') {
        await clearMissingChannelState(guildId, state);
        return;
      }
      if (status === 'missing') {
        changes.roleCountMessageId = undefined;
      }
    }

    // Verificar mensajes de tarjetas de rango
    if (state.rankCardMessageIds) {
      const cardMessageIds = { ...state.rankCardMessageIds };

      for (const [rankId, messageId] of Object.entries(cardMessageIds)) {
        const status = await checkMessageReference(
          channel,
          messageId,
          `el card de rango ${rankId}`
        );
        if (status === 'channel-missing') {
          await clearMissingChannelState(guildId, state);
          return;
        }
        if (status === 'missing') {
          delete cardMessageIds[rankId];
          changes.rankCardMessageIds = cardMessageIds;
        }
      }
    }

    // Verificar header del panel de rangos
    if (state.rankPanelHeaderMessageId) {
      const status = await checkMessageReference(
        channel,
        state.rankPanelHeaderMessageId,
        'el header del panel'
      );
      if (status === 'channel-missing') {
        await clearMissingChannelState(guildId, state);
        return;
      }
      if (status === 'missing') {
        changes.rankPanelHeaderMessageId = undefined;
      }
    }

    // Verificar mensaje de gestión del panel de rangos
    if (state.rankPanelManagementMessageId) {
      const status = await checkMessageReference(
        channel,
        state.rankPanelManagementMessageId,
        'el panel de gestión'
      );
      if (status === 'channel-missing') {
        await clearMissingChannelState(guildId, state);
        return;
      }
      if (status === 'missing') {
        changes.rankPanelManagementMessageId = undefined;
      }
    }

    if (Object.keys(changes).length > 0) {
      await updateRolesState(guildId, () => changes);
      await logApp(`Estado limpiado para guild ${guildId}`);
    }
  } catch (error) {
    console.error(
      `[Cleanup] Error general limpiando referencias para guild ${guildId}:`,
      error
    );
    // No relanzar el error para no romper el flujo del comando
  }
}

// #endregion

// #region API pública

/**
 * Actualiza un mensaje solo si sigue existiendo.
 *
 * Descarta la actualización cuando Discord confirma que el mensaje ya no
 * existe y registra cualquier otro error sin propagarlo.
 *
 * @param channel - Canal que contiene el mensaje.
 * @param messageId - ID del mensaje a actualizar.
 * @param updateFunction - Actualización a aplicar sobre el mensaje obtenido.
 * @returns `true` si el mensaje existía y se actualizó.
 */
export async function safeMessageUpdate(
  channel: any,
  messageId: string,
  updateFunction: (message: any) => Promise<void>
): Promise<boolean> {
  try {
    const message = await channel.messages.fetch(messageId);
    await updateFunction(message);
    return true;
  } catch (error: any) {
    if (error.code === 10008) {
      console.warn(
        `[SafeUpdate] Mensaje ${messageId} no existe, omitiendo actualización`
      );
      return false;
    }
    console.error(
      `[SafeUpdate] Error inesperado actualizando mensaje ${messageId}:`,
      error
    );
    return false;
  }
}

// #endregion
