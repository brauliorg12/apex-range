import { TextChannel, Message, Collection } from 'discord.js';

/**
 * Función para limpiar mensajes existentes del bot en el canal.
 *
 * Verifica y elimina mensajes antiguos del bot que coincidan con criterios específicos,
 * como contenido relacionado con estadísticas o selección de rango, excluyendo mensajes fijados.
 *
 * @param channel - El canal de texto donde se realizará la limpieza (debe ser un TextChannel).
 * @param logger - Instancia del logger para registrar información y advertencias durante el proceso.
 * @returns Una promesa que se resuelve cuando la limpieza se completa.
 */
export async function cleanupExistingMessages(
  channel: TextChannel,
  logger: {
    info: (message: string) => void;
    warn: (message: string, error?: any) => void;
  }
): Promise<void> {
  try {
    logger.info('Verificando mensajes existentes del bot...');

    // Obtener mensajes recientes del canal
    const messages: Collection<string, Message> = await channel.messages.fetch({
      limit: 50,
    });

    // Filtrar mensajes del bot que podrían ser del setup anterior
    const botMessages = messages.filter(
      (msg: Message) =>
        msg.author.id === channel.client.user.id &&
        (msg.content.includes('Generando estadísticas') ||
          msg.content.includes('SELECCIONA TU RANGO') ||
          msg.embeds.some((embed) =>
            embed.title?.includes('SELECCIONA TU RANGO')
          ))
    );

    if (botMessages.size > 0) {
      logger.info(
        `Encontrados ${botMessages.size} mensajes antiguos del bot para limpiar`
      );

      // Eliminar mensajes antiguos (excepto los que están fijados)
      for (const [id, message] of botMessages) {
        try {
          if (!message.pinned) {
            await message.delete();
            logger.info(`Mensaje antiguo eliminado: ${id}`);
          }
        } catch (error) {
          logger.warn(`No se pudo eliminar mensaje ${id}:`, error);
        }
      }
    } else {
      logger.info('No se encontraron mensajes antiguos del bot para limpiar');
    }
  } catch (error) {
    logger.warn('Error durante limpieza de mensajes:', error);
  }
}
