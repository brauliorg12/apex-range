import { logApp } from './logger';

/**
 * Canal mínimo necesario para verificar referencias de mensajes.
 */
export interface MessageFetcherChannel {
  /** Mensajes del canal. */
  messages: {
    /**
     * Obtiene un mensaje por ID.
     *
     * @param messageId - ID del mensaje.
     * @returns El mensaje obtenido o una promesa rechazada.
     */
    fetch(messageId: string): Promise<unknown>;
  };
}

/**
 * Estado de una referencia a un mensaje verificado contra Discord.
 *
 * - `ok`: el mensaje existe.
 * - `missing`: el mensaje ya no existe (`10008`).
 * - `channel-missing`: el canal ya no existe (`10003`).
 * - `unknown`: error transitorio; la referencia se conserva.
 */
export type MessageReferenceStatus =
  | 'ok'
  | 'missing'
  | 'channel-missing'
  | 'unknown';

/**
 * Obtiene el código de error de Discord, si está disponible.
 *
 * @param error - Error recibido.
 * @returns El código numérico o `null` si no existe.
 */
function getDiscordErrorCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }

  return typeof error.code === 'number' ? error.code : null;
}

/**
 * Indica si el error corresponde a un mensaje inexistente.
 *
 * @param error - Error recibido.
 * @returns `true` si el código es `10008`.
 */
export function isUnknownMessageError(error: unknown): boolean {
  return getDiscordErrorCode(error) === 10008;
}

/**
 * Indica si el error corresponde a un canal inexistente.
 *
 * @param error - Error recibido.
 * @returns `true` si el código es `10003`.
 */
export function isUnknownChannelError(error: unknown): boolean {
  return getDiscordErrorCode(error) === 10003;
}

/**
 * Convierte un error desconocido en un mensaje legible.
 *
 * @param error - Error recibido.
 * @returns El mensaje del error o su representación en texto.
 */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Verifica si un mensaje referenciado todavía existe.
 *
 * Solo considera eliminable una referencia cuando Discord confirma que el
 * mensaje (`10008`) o el canal (`10003`) ya no existen. Los errores
 * transitorios, de permisos o de red se conservan y se registran como warning.
 *
 * @param channel - Canal donde se busca el mensaje.
 * @param messageId - ID del mensaje referenciado.
 * @param label - Descripción de la referencia para los logs.
 * @returns El estado de la referencia.
 */
export async function checkMessageReference(
  channel: MessageFetcherChannel,
  messageId: string,
  label: string
): Promise<MessageReferenceStatus> {
  try {
    await channel.messages.fetch(messageId);
    return 'ok';
  } catch (error) {
    if (isUnknownMessageError(error)) {
      await logApp(
        `[Cleanup] Referencia inválida detectada (${label}): ${messageId}`
      );
      return 'missing';
    }

    if (isUnknownChannelError(error)) {
      return 'channel-missing';
    }

    await logApp(
      `[Cleanup][WARN] No se pudo verificar ${label} ${messageId}; se ` +
        `conserva: ${describeError(error)}`
    );
    return 'unknown';
  }
}
