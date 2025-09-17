import {
  SlashCommandBuilder,
  PermissionsBitField,
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { writeRolesState } from '../utils/state-manager';
import { updateBotPresence } from '../utils/presence-helper';
import { updateRoleCountMessage } from '../utils/update-status-message';
import {
  createRankButtons,
  createManagementButtons,
} from '../utils/button-helper';
import { sendOnlinePanel } from '../utils/send-online-panel';
import { checkBotPermissions } from '../utils/permission-checker';
import { handleMissingRoles } from '../utils/setup-config-handler';
import { getServerLogger } from '../utils/server-logger';
import { sendMessageWithTimeout } from '../helpers/set-message-timeout';
import { cleanupExistingMessages } from '../helpers/cleanup-existing-messages';
// Importar la constante del texto del embed para evitar duplicación
import { ROLE_SELECTION_EMBED_TEXT } from '../helpers/update-role-selection-image';
// Importar la configuración de imágenes
import { imagesConfig } from '../configs/images';

/**
 * Definición del comando /setup-roles para Discord.
 *
 * Utiliza SlashCommandBuilder para registrar el comando que configura los paneles de selección de roles y estadísticas.
 * El nombre y la descripción aparecerán en Discord al desplegar el comando.
 */
export const data = new SlashCommandBuilder()
  .setName('setup-roles')
  .setDescription(
    'Configura los paneles de selección de roles y estadísticas.'
  );
/**
 * Ejecuta el comando setup-roles.
 * Este comando es solo para administradores y realiza las siguientes acciones:
 * 1. Verifica que todos los roles de rango de Apex existan en el servidor.
 * 2. Envía un mensaje para que los usuarios seleccionen su rango.
 * 3. Envía un mensaje de estadísticas que se mantendrá actualizado.
 * 4. Guarda los IDs de los mensajes en el estado del bot.
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.guildId) return;

  // Crear logger específico para este servidor
  const logger = getServerLogger(interaction.guild.id, interaction.guild.name);

  // Log detallado para debugging
  logger.info('=== INICIANDO SETUP-ROLES ===');
  logger.info(
    `Canal: ${
      interaction.channel && 'name' in interaction.channel
        ? interaction.channel.name
        : 'Desconocido'
    } (${interaction.channel?.id || 'Desconocido'})`
  );
  logger.info(`Usuario: ${interaction.user.tag} (${interaction.user.id})`);

  // Marca el inicio del comando para medir duración
  const startTime = Date.now();

  // 1. Comprobar permisos de administrador
  if (
    !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)
  ) {
    logger.warn(
      `Usuario ${interaction.user.tag} intentó ejecutar setup-roles sin permisos de administrador`
    );
    await interaction.reply({
      content: 'Este comando solo puede ser usado por administradores.',
      ephemeral: true,
    });
    return;
  }

  logger.info('Permisos de administrador verificados correctamente');

  // 2. Verificar que los roles de rango existen usando el handler dedicado
  logger.info('Verificando roles existentes...');
  const canContinue = await handleMissingRoles(interaction);
  if (!canContinue) {
    logger.info('Configuración cancelada por roles faltantes');
    return; // El handler ya manejó la respuesta al usuario
  }

  const channel = interaction.channel as TextChannel;
  if (!channel) {
    logger.error('No se pudo identificar el canal actual');
    await interaction.editReply({
      content: '❌ Error: No se pudo identificar el canal actual.',
    });
    return;
  }

  logger.info(`Canal identificado: #${channel.name} (${channel.id})`);

  await interaction.deferReply({ ephemeral: true });
  logger.info('Respuesta diferida correctamente');

  try {
    // Verificar que el canal esté disponible y funcional
    logger.info('Verificando disponibilidad del canal...');
    try {
      // Enviar un mensaje de prueba pequeño para verificar conectividad
      const testMessage = await sendMessageWithTimeout(
        channel,
        { content: '🔄 Verificando configuración...' },
        10000
      );

      // Eliminar el mensaje de prueba inmediatamente
      await testMessage.delete();
      logger.info('Canal verificado correctamente');
    } catch (error) {
      logger.error('Error verificando canal:', error);
      throw new Error(
        'El canal no está disponible o hay problemas de conectividad. Intenta nuevamente.'
      );
    }

    // Verificar permisos del bot usando el módulo dedicado
    logger.info('Verificando permisos del bot...');
    const permissionsOk = await checkBotPermissions(interaction, channel);
    if (!permissionsOk) {
      logger.warn('Configuración cancelada por permisos insuficientes del bot');
      return; // La función checkBotPermissions ya manejó la respuesta de error
    }

    logger.info('Permisos del bot verificados correctamente');

    // Limpiar mensajes existentes antes de crear nuevos
    await cleanupExistingMessages(channel, logger);

    // 3. Mensaje de selección de rango
    logger.info('Creando mensaje de selección de rango...');
    const roleSelectionEmbed = new EmbedBuilder()
      .setColor('#f1c40f')
      .setTitle('🎯 SELECCIONA TU RANGO')
      .setDescription(ROLE_SELECTION_EMBED_TEXT)
      .setImage(imagesConfig.initRoleSelectionImage);

    let roleSelectionMessage;
    try {
      roleSelectionMessage = await sendMessageWithTimeout(
        channel,
        {
          embeds: [roleSelectionEmbed],
          components: createRankButtons(interaction.client),
        },
        15000 // 15 segundos timeout
      );
      logger.info(
        `Mensaje de selección de rango enviado: ${roleSelectionMessage.id}`
      );
    } catch (error) {
      logger.error('Error enviando mensaje de selección de rango:', error);
      throw new Error(
        'No se pudo enviar el mensaje de selección de rango. Verifica los permisos del bot.'
      );
    }

    // 4. Mensaje de estadísticas
    logger.info('Creando mensaje de estadísticas...');
    let roleCountMessage;
    try {
      roleCountMessage = await sendMessageWithTimeout(
        channel,
        {
          content: 'Generando estadísticas...',
          components: [...createManagementButtons()],
        },
        15000 // 15 segundos timeout
      );
      logger.info(`Mensaje de estadísticas enviado: ${roleCountMessage.id}`);
    } catch (error) {
      logger.error('Error enviando mensaje de estadísticas:', error);
      throw new Error(
        'No se pudo enviar el mensaje de estadísticas. Verifica los permisos del bot.'
      );
    }

    // Fijar ambos mensajes
    logger.info('Fijando mensajes...');
    try {
      await roleSelectionMessage.pin();
      await roleCountMessage.pin();
      logger.info('Mensajes fijados correctamente');
    } catch (err) {
      logger.error('Error al fijar los mensajes', err);
      await channel.send(
        "⚠️ No pude fijar los mensajes. Por favor, asegúrate de que tengo permisos para 'Gestionar Mensajes'."
      );
    }

    // 5. Guardar estado
    logger.info('Guardando estado del bot...');
    try {
      await writeRolesState({
        roleCountMessageId: roleCountMessage.id,
        roleSelectionMessageId: roleSelectionMessage.id,
        channelId: channel.id,
        guildId: interaction.guild.id,
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

    // 6. Actualizar mensajes y presencia
    logger.info('Enviando panel online...');
    try {
      await sendOnlinePanel(channel, interaction.guild);
      logger.info('Panel online enviado correctamente');
    } catch (error) {
      logger.error('Error enviando panel online', error);
      // No lanzamos error aquí, continuamos con la configuración
    }

    // Actualización inmediata de estadísticas después del setup
    logger.info('Actualizando estadísticas...');
    let statsUpdated = false;
    try {
      await updateRoleCountMessage(interaction.guild);
      statsUpdated = true;
      logger.info('Estadísticas actualizadas correctamente');
    } catch (error) {
      logger.error('Error actualizando estadísticas', error);
      // Intentamos actualizar el mensaje de estadísticas con error
      try {
        await roleCountMessage.edit({
          content: '❌ Error al generar estadísticas. Revisa los logs del bot.',
          components: [...createManagementButtons()],
        });
        logger.info('Mensaje de error de estadísticas actualizado');
      } catch (editError) {
        logger.error('Error editando mensaje de estadísticas', editError);
      }
    }

    logger.info('Actualizando presencia global...');
    try {
      await updateBotPresence(interaction.client);
      logger.info('Presencia global actualizada correctamente');
    } catch (error) {
      logger.error('Error actualizando presencia', error);
      // No lanzamos error aquí, la presencia no es crítica
    }

    // Calcula segundos transcurridos
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    // Actualizar mensaje de estadísticas si fue exitoso
    if (statsUpdated) {
      try {
        await updateRoleCountMessage(interaction.guild);
        logger.info('Mensaje de estadísticas final actualizado');
      } catch (error) {
        logger.error('Error final actualizando estadísticas', error);
      }
    }

    logger.info(`=== SETUP-ROLES COMPLETADO en ${elapsed} segundos ===`);

    await interaction.editReply({
      content: `✅ **¡Configuración completada en ${elapsed} segundos!**

📊 **Estadísticas:** ${
        statsUpdated ? '✅ Actualizadas' : '⚠️ Error - revisa logs'
      }
🔄 **Presencia global actualizada**

📌 _Puedes eliminar los mensajes fijados que no sean de la App para mantener el canal ordenado._

💡 Ejemplo:
*"Apex Range ha fijado un mensaje en este canal. Mira todos los mensajes fijados."*

🏆 ¡Listo para usar el panel de rangos!`,
    });
  } catch (error) {
    logger.error('Error durante la configuración', error);
    try {
      await interaction.editReply({
        content: `❌ **Error durante la configuración**

Ha ocurrido un error inesperado. Revisa los logs del bot para más detalles.

**Error:** ${error instanceof Error ? error.message : 'Error desconocido'}`,
      });
    } catch (editError) {
      logger.error('Error editando respuesta', editError);
      // Si no podemos editar la respuesta, enviamos un mensaje al canal
      await channel.send({
        content: `❌ **Error en configuración de Apex Range**

Ha ocurrido un error durante la configuración. Por favor, intenta ejecutar el comando nuevamente.`,
      });
    }
  }
}
