import { DiscordAPIError, TextChannel } from 'discord.js';
import { PanelDeletionResult } from './rank-panel-types';

/** Pausa entre borrados individuales para no saturar la API. */
const DELETE_DELAY_MS = 150;

/**
 * Indica si un error corresponde a un mensaje que ya no existe en Discord.
 *
 * Acepta `DiscordAPIError` y errores equivalentes con código `10008`.
 *
 * @param error - Error capturado al borrar un mensaje.
 * @returns `true` si el código corresponde a un mensaje inexistente.
 */
function isUnknownMessageError(error: unknown): boolean {
  if (error instanceof DiscordAPIError) {
    return error.code === 10008;
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 10008
  );
}

/**
 * Convierte un error desconocido en un mensaje legible.
 *
 * @param error - Error capturado.
 * @returns El mensaje del error o su representación en texto.
 */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Borra mensajes del panel de a uno.
 * Tolera el error `10008` (mensaje inexistente) y conserva los IDs que fallaron
 * por otros motivos para reintentar en el próximo sync.
 *
 * @param channel - Canal donde están los mensajes.
 * @param messageIds - IDs de los mensajes a borrar.
 * @returns Avisos y IDs que no se pudieron borrar.
 */
export async function deletePanelMessages(
  channel: TextChannel,
  messageIds: string[]
): Promise<PanelDeletionResult> {
  const warnings: string[] = [];
  const failedIds: string[] = [];

  for (const messageId of messageIds) {
    try {
      await channel.messages.delete(messageId);
    } catch (error) {
      if (!isUnknownMessageError(error)) {
        warnings.push(
          `No se pudo borrar el mensaje ${messageId}: ${describeError(error)}`
        );
        failedIds.push(messageId);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, DELETE_DELAY_MS));
  }

  return { warnings, failedIds };
}
