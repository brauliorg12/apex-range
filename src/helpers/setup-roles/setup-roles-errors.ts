import {
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { sendMessageWithTimeout } from '../set-message-timeout';

/**
 * Verifica la disponibilidad y permisos del canal enviando un mensaje de prueba.
 *
 * Envía un mensaje temporal al canal para confirmar que el bot puede enviar mensajes
 * y que tiene los permisos necesarios. Si falla, detecta errores de permisos específicos
 * y muestra una guía detallada. El mensaje de prueba se elimina automáticamente.
 *
 * @param interaction - La interacción del comando para mostrar errores de permisos.
 * @param channel - El canal a verificar.
 * @param logger - Instancia del logger para registrar operaciones.
 * @returns Verdadero si el canal está disponible y accesible, falso en caso contrario.
 */
export async function verifyChannelAccess(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  logger: any
): Promise<boolean> {
  logger.info('Verificando disponibilidad del canal...');

  let testMessage;
  try {
    testMessage = await sendMessageWithTimeout(
      channel,
      { content: '🔄 Verificando configuración...' },
      10000
    );
    logger.info('Canal verificado correctamente');
    return true;
  } catch (error: any) {
    logger.error('Error verificando canal:', error);

    if (error?.code === 50013 || error?.rawError?.code === 50013) {
      await showChannelPermissionsError(interaction, channel, logger);
      return false;
    }

    throw new Error(
      'El canal no está disponible o hay problemas de conectividad. Intenta nuevamente.'
    );
  } finally {
    if (testMessage) {
      try {
        await testMessage.delete();
      } catch (deleteError) {
        logger.warn(
          'No se pudo borrar el mensaje de verificación',
          deleteError
        );
      }
    }
  }
}

/**
 * Muestra el error de permisos del canal con guía detallada.
 *
 * Cuando el bot no tiene permisos para enviar mensajes en un canal específico,
 * muestra un embed con instrucciones paso a paso para resolver el problema.
 * El embed incluye guías visuales y consejos para configurar los permisos correctamente.
 *
 * @param interaction - La interacción del comando para editar la respuesta.
 * @param channel - El canal donde faltan permisos.
 * @param logger - Instancia del logger para registrar el evento.
 */
async function showChannelPermissionsError(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel,
  logger: any
): Promise<void> {
  logger.warn('Error de permisos detectado en el canal');

  const embed = new EmbedBuilder()
    .setColor('#ff6b6b')
    .setTitle('❌ Permisos Insuficientes en el Canal')
    .setDescription(
      `El bot no puede enviar mensajes en el canal <#${channel.id}>. Esto se debe a configuraciones específicas de permisos en este canal.`
    )
    .addFields(
      {
        name: '🔧 Solución Rápida',
        value: `Ve al canal <#${channel.id}> y sigue estos pasos:`,
        inline: false,
      },
      {
        name: '📋 Pasos a seguir:',
        value:
          '1️⃣ **Click derecho** en el canal\n' +
          '2️⃣ Selecciona **"Editar Canal"**\n' +
          '3️⃣ Ve a la pestaña **"Permisos"**\n' +
          '4️⃣ Busca el rol **"Apex Range"** (o el rol del bot)\n' +
          '5️⃣ **Activa ✅ estos permisos:**\n' +
          '   • ✅ Enviar Mensajes\n' +
          '   • ✅ Ver Canal\n' +
          '   • ✅ Adjuntar Archivos\n' +
          '   • ✅ Insertar Enlaces\n' +
          '   • ✅ Gestionar Mensajes\n' +
          '6️⃣ **Guarda los cambios**\n' +
          '7️⃣ Ejecuta `/setup-roles` nuevamente',
        inline: false,
      },
      {
        name: '⚠️ Importante',
        value:
          'Si ves **overrides rojos (❌)** para el bot, cámbialos a **"Permitir" (✅)**.',
        inline: false,
      }
    )
    .setFooter({
      text: 'Los permisos del servidor no son suficientes si el canal tiene overrides específicos',
    });

  await interaction.editReply({
    embeds: [embed],
  });
}
