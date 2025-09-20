import {
  TextChannel,
  EmbedBuilder,
  Message,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { sendMessageWithTimeout } from '../set-message-timeout';
import { ROLE_SELECTION_EMBED_TEXT } from '../update-role-selection-image';
import { imagesConfig } from '../../configs/images';
import {
  createManagementButtons,
  createRankButtons,
} from '../../utils/button-helper';
import { SELECT_EMOGI } from '../../models/constants';

/**
 * Crea el mensaje de selección de rango con botones interactivos.
 *
 * Envía un mensaje embed con la descripción de selección de rango y botones
 * para que los usuarios puedan elegir su rango de Apex Legends. Incluye
 * un timeout para evitar que el mensaje quede pendiente indefinidamente.
 *
 * @param channel - El canal de Discord donde enviar el mensaje.
 * @param logger - Instancia del logger para registrar operaciones.
 * @returns El mensaje creado, o lanza un error si falla.
 */
export async function createRoleSelectionMessage(
  channel: TextChannel,
  logger: any
): Promise<Message> {
  logger.info('Creando mensaje de selección de rango...');

  const roleSelectionEmbed = new EmbedBuilder()
    .setColor('#f1c40f')
    .setTitle(SELECT_EMOGI + ' SELECCIONA TU RANGO DE APEX LEGENDS')
    .setDescription(ROLE_SELECTION_EMBED_TEXT)
    .setImage(imagesConfig.initRoleSelectionImage);

  try {
    const message = await sendMessageWithTimeout(
      channel,
      {
        embeds: [roleSelectionEmbed],
        components: createRankButtons(channel.client),
      },
      15000
    );
    logger.info(`Mensaje de selección de rango enviado: ${message.id}`);
    return message;
  } catch (error) {
    logger.error('Error enviando mensaje de selección de rango:', error);
    throw new Error(
      'No se pudo enviar el mensaje de selección de rango. Verifica los permisos del bot.'
    );
  }
}

/**
 * Crea el mensaje de estadísticas con botones de gestión.
 *
 * Envía un mensaje inicial de estadísticas que se actualizará dinámicamente
 * con información sobre los roles y jugadores. Incluye botones para
 * gestionar el panel. Usa un timeout para asegurar que el envío se complete.
 *
 * @param channel - El canal de Discord donde enviar el mensaje.
 * @param logger - Instancia del logger para registrar operaciones.
 * @returns El mensaje creado, o lanza un error si falla.
 */
export async function createStatsMessage(
  channel: TextChannel,
  logger: any
): Promise<Message> {
  logger.info('Creando mensaje de estadísticas...');

  try {
    const components = createManagementButtons();
    logger.info(`Componentes creados: ${components.length} filas`);

    const message = await sendMessageWithTimeout(
      channel,
      {
        content: 'Generando estadísticas...',
        components: components,
      },
      15000
    );
    logger.info(`Mensaje de estadísticas enviado: ${message.id}`);
    return message;
  } catch (error) {
    logger.error('Error enviando mensaje de estadísticas:', error);
    logger.error('Detalles del error:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    throw new Error(
      'No se pudo enviar el mensaje de estadísticas. Verifica los permisos del bot.'
    );
  }
}

/**
 * Fija los mensajes creados en el canal para mantenerlos visibles.
 *
 * Intenta fijar tanto el mensaje de selección de rango como el de estadísticas.
 * Si falla debido a permisos insuficientes, informa al usuario con un mensaje
 * efímero en lugar de enviar al canal público.
 *
 * @param roleSelectionMessage - El mensaje de selección de rango a fijar.
 * @param roleCountMessage - El mensaje de estadísticas a fijar.
 * @param channel - El canal donde se fijarán los mensajes.
 * @param interaction - La interacción del comando para enviar followUps efímeros.
 * @param logger - Instancia del logger para registrar operaciones y errores.
 */
export async function pinSetupMessages(
  roleSelectionMessage: Message,
  roleCountMessage: Message,
  channel: TextChannel,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  logger: any
): Promise<void> {
  logger.info('Fijando mensajes...');

  try {
    await roleSelectionMessage.pin();
    await roleCountMessage.pin();
    logger.info('Mensajes fijados correctamente');
  } catch (err) {
    logger.error('Error al fijar los mensajes', err);
    await interaction.followUp({
      content:
        "⚠️ No pude fijar los mensajes. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'.",
      ephemeral: true,
    });
  }
}
