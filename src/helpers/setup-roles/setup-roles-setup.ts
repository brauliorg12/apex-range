import { TextChannel, Message } from 'discord.js';
import { writeRolesState } from '../../utils/state-manager';
import { updateBotPresence } from '../../utils/presence-helper';
import { updateRoleCountMessage } from '../../utils/update-status-message';
import { sendOnlinePanel } from '../../utils/send-online-panel';
import { createManagementButtons } from '../../utils/button-helper';

/**
 * Guarda el estado de la configuración del bot para el servidor.
 *
 * Esta función almacena los IDs de los mensajes de selección de rango y estadísticas,
 * junto con el ID del canal y del servidor, para permitir la actualización y gestión
 * posterior de los mensajes. Esto es crucial para mantener la funcionalidad del bot
 * después de reinicios o actualizaciones.
 *
 * @param roleCountMessage - El mensaje que muestra las estadísticas de roles y permite gestión.
 * @param roleSelectionMessage - El mensaje que permite a los usuarios seleccionar su rango.
 * @param channel - El canal de Discord donde se realizó la configuración.
 * @param guildId - El ID único del servidor de Discord.
 * @param logger - Instancia del logger para registrar operaciones y errores.
 */
export async function saveSetupState(
  roleCountMessage: Message,
  roleSelectionMessage: Message,
  channel: TextChannel,
  guildId: string,
  logger: any
): Promise<void> {
  logger.info('Guardando estado del bot...');

  try {
    await writeRolesState({
      roleCountMessageId: roleCountMessage.id,
      roleSelectionMessageId: roleSelectionMessage.id,
      channelId: channel.id,
      guildId: guildId,
      rankCardMessageIds: {},
    });
    logger.info('Estado guardado correctamente');
  } catch (error) {
    logger.error('Error guardando estado', error);
    throw new Error(
      `Error guardando configuración: ${
        error instanceof Error ? error.message : 'Error desconocido'
      }`
    );
  }
}

/**
 * Finaliza la configuración del bot actualizando presencia, estadísticas y enviando panel online.
 *
 * Esta función realiza las tareas finales después de una configuración exitosa:
 * - Envía un panel que muestra los jugadores online.
 * - Actualiza las estadísticas de roles en el mensaje correspondiente.
 * - Actualiza la presencia global del bot.
 * - Mide y registra el tiempo total de configuración.
 *
 * Maneja errores de manera robusta, intentando actualizar el mensaje de estadísticas
 * incluso si hay fallos, y registra todos los eventos en el logger.
 *
 * @param channel - El canal de Discord donde se configuró el bot.
 * @param guild - El objeto Guild de Discord para el servidor.
 * @param client - El cliente de Discord para actualizar presencia.
 * @param roleCountMessage - El mensaje de estadísticas que puede ser editado en caso de error.
 * @param logger - Instancia del logger para registrar operaciones.
 * @returns Un objeto con el estado de actualización de estadísticas y el tiempo transcurrido.
 */
export async function finalizeSetup(
  channel: TextChannel,
  guild: any,
  client: any,
  roleCountMessage: Message,
  logger: any
): Promise<{ statsUpdated: boolean; elapsed: string }> {
  // Marca el inicio del comando para medir duración
  const startTime = Date.now();

  // Enviar panel online
  logger.info('Enviando panel online...');
  try {
    await sendOnlinePanel(channel, guild);
    logger.info('Panel online enviado correctamente');
  } catch (error) {
    logger.error('Error enviando panel online', error);
  }

  // Actualizar estadísticas
  logger.info('Actualizando estadísticas...');
  let statsUpdated = false;
  try {
    await updateRoleCountMessage(guild);
    statsUpdated = true;
    logger.info('Estadísticas actualizadas correctamente');
  } catch (error) {
    logger.error('Error actualizando estadísticas:', error);
    logger.error('Detalles del error:', {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      code: (error as any)?.code,
    });
    try {
      await roleCountMessage.edit({
        content: `❌ Error al generar estadísticas: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }. Revisa los logs del bot.`,
        components: [...createManagementButtons()],
      });
      logger.info('Mensaje de error de estadísticas actualizado');
    } catch (editError) {
      logger.error('Error editando mensaje de estadísticas', editError);
    }
  }

  // Actualizar presencia global
  logger.info('Actualizando presencia global...');
  try {
    await updateBotPresence(client);
    logger.info('Presencia global actualizada correctamente');
  } catch (error) {
    logger.error('Error actualizando presencia', error);
  }

  // Actualización final de estadísticas
  if (statsUpdated) {
    try {
      await updateRoleCountMessage(guild);
      logger.info('Mensaje de estadísticas final actualizado');
    } catch (error) {
      logger.error('Error final actualizando estadísticas', error);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  logger.info(`=== SETUP-ROLES COMPLETADO en ${elapsed} segundos ===`);

  return { statsUpdated, elapsed };
}

/**
 * Re-ejecuta el panel de gestión completo en el canal actual.
 * Ejecuta sendOnlinePanel, updateRoleCountMessage y updateBotPresence.
 * Diseñado para ser usado desde el botón 'Panel de Gestión' en el menú de setup.
 */
export async function rerunManagementPanel(
  channel: TextChannel,
  guild: any,
  client: any,
  logger: any
): Promise<{ success: boolean; elapsed: string }> {
  const start = Date.now();

  logger.info('Ejecutando PANEL DE GESTIÓN en canal actual...');

  try {
    // Re-ejecutar panel online
    await sendOnlinePanel(channel, guild);
    // Actualizar estadísticas
    await updateRoleCountMessage(guild);
    // Actualizar presencia global
    await updateBotPresence(client);

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    logger.info(`PANEL DE GESTIÓN ejecutado correctamente en ${elapsed}s`);
    return { success: true, elapsed };
  } catch (error) {
    logger.error('Error ejecutando panel de gestión', error);
    try {
      await channel.send({
        content: `❌ Error ejecutando panel de gestión: ${
          error instanceof Error ? error.message : 'Error desconocido'
        }`,
      });
    } catch (notifyError) {
      logger.error(
        'No se pudo notificar en el canal sobre el error del panel de gestión',
        notifyError
      );
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    return { success: false, elapsed };
  }
}
