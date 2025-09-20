import { readRolesState, writeRolesState } from './state-manager';
import { RolesState } from '../interfaces/bot-state';
import { logApp } from './logger';

/**
 * Limpia referencias a mensajes inexistentes del estado de un servidor.
 * Verifica si los mensajes aún existen y elimina las referencias inválidas.
 */
export async function cleanupInvalidMessageReferences(
  guildId: string,
  client: any
): Promise<void> {
  try {
    const state = await readRolesState(guildId);
    if (!state || !state.channelId) return;

    let needsUpdate = false;

    // Verificar mensaje de selección de roles
    if (state.roleSelectionMessageId) {
      try {
        const channel = await client.channels.fetch(state.channelId);
        if (channel && 'messages' in channel) {
          await channel.messages.fetch(state.roleSelectionMessageId);
        }
      } catch (error) {
        await logApp(
          `Eliminando referencia inválida al mensaje de selección de roles: ${state.roleSelectionMessageId}`
        );
        state.roleSelectionMessageId = undefined;
        needsUpdate = true;
      }
    }

    // Verificar mensaje de estadísticas
    if (state.roleCountMessageId) {
      try {
        const channel = await client.channels.fetch(state.channelId);
        if (channel && 'messages' in channel) {
          await channel.messages.fetch(state.roleCountMessageId);
        }
      } catch (error) {
        await logApp(
          `Eliminando referencia inválida al mensaje de estadísticas: ${state.roleCountMessageId}`
        );
        state.roleCountMessageId = undefined;
        needsUpdate = true;
      }
    }

    // Verificar mensajes de tarjetas de rango
    if (state.rankCardMessageIds) {
      for (const [rankId, messageId] of Object.entries(
        state.rankCardMessageIds
      )) {
        try {
          const channel = await client.channels.fetch(state.channelId);
          if (channel && 'messages' in channel) {
            await channel.messages.fetch(messageId);
          }
        } catch (error) {
          await logApp(
            `Eliminando referencia inválida al mensaje de rango ${rankId}: ${messageId}`
          );
          delete state.rankCardMessageIds[rankId];
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate && state.guildId) {
      await writeRolesState(state as RolesState & { guildId: string });
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

/**
 * Función helper para manejar errores de mensajes inexistentes de manera segura.
 * Retorna true si el mensaje existe y se puede actualizar, false si no existe.
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
