import { TextChannel, MessageCreateOptions, Message } from 'discord.js';

/**
 * Función helper para enviar mensajes con timeout y mejor manejo de errores.
 *
 * Envía un mensaje a un canal de Discord con un límite de tiempo para evitar bloqueos.
 * Si el envío supera el timeout especificado, rechaza la promesa con un error.
 *
 * @param channel - El canal de texto donde se enviará el mensaje (debe ser un TextChannel).
 * @param options - Las opciones para crear el mensaje, como contenido, embeds, etc.
 * @param timeoutMs - Tiempo máximo en milisegundos para esperar el envío (por defecto 30000ms).
 * @returns Una promesa que resuelve con el objeto Message enviado, o rechaza con un error.
 */
export async function sendMessageWithTimeout(
  channel: TextChannel,
  options: MessageCreateOptions,
  timeoutMs: number = 30000
): Promise<Message> {
  return new Promise(async (resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout al enviar mensaje después de ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const message = await channel.send(options);
      clearTimeout(timeout);
      resolve(message);
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}
