import {
  TextChannel,
  ChatInputCommandInteraction,
  ButtonInteraction,
} from 'discord.js';
import { cleanupExistingMessages } from '../cleanup-existing-messages';
import {
  createRoleSelectionMessage,
  createStatsMessage,
  saveSetupState,
  finalizeSetup,
} from '../setup-roles';
import {
  createOrVerifyControlChannel,
  createOrVerifyPanelChannel,
} from './create-control-channel';
import { writeBotControlState, readPlayers } from '../../utils/state-manager';

/**
 * Funcion que ejecuta el setup completo despues de la confirmacion
 * @param channel El canal donde configurar
 * @param interaction La interaccion original
 * @param logger El logger del servidor
 */
export async function performSetup(
  channel: TextChannel,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  logger: any
) {
  // PASO 8: Crear/verificar canal de control del bot
  let controlChannel: TextChannel | undefined;
  try {
    controlChannel = await createOrVerifyControlChannel(
      interaction.guild!,
      logger
    );
    logger.info('Canal de control verificado/creado correctamente');

    // Guardar estado del canal de control
    await writeBotControlState({
      controlChannelId: controlChannel.id,
      guildId: interaction.guild!.id,
    });
    logger.info('Estado del canal de control guardado');
  } catch (error) {
    logger.error('Error con canal de control:', error);
    // Continuar sin canal de control, pero loggear el problema
    controlChannel = undefined;
    await interaction.followUp({
      content:
        '⚠️ No se pudo crear/verificar el canal de control. El bot funcionara, pero algunas operaciones podrian tener problemas de permisos.',
      ephemeral: true,
    });
  }

  // PASO 9: Crear/verificar canal del panel de rangos
  let panelChannel: TextChannel;
  try {
    panelChannel = await createOrVerifyPanelChannel(
      interaction.guild!,
      logger,
      controlChannel // Puede ser undefined si falló la creación
    );
    logger.info('Canal del panel verificado/creado correctamente');
  } catch (error) {
    logger.error('Error con canal del panel:', error);
    // Usar el canal original como fallback
    panelChannel = channel;
    await interaction.followUp({
      content:
        '⚠️ No se pudo crear/verificar el canal del panel. Usando el canal actual como alternativa.',
      ephemeral: true,
    });
  }

  // PASO 10: Limpiar mensajes existentes
  await cleanupExistingMessages(panelChannel, logger);
  logger.info('Mensajes existentes limpiados');

  // PASO 11: Crear mensajes de seleccion de rango y estadisticas
  const roleSelectionMessage = await createRoleSelectionMessage(
    panelChannel,
    logger
  );
  const roleCountMessage = await createStatsMessage(panelChannel, logger);
  logger.info('Mensajes de seleccion y estadisticas creados');

  // PASO 12: Guardar estado de la configuracion
  await saveSetupState(
    roleCountMessage,
    roleSelectionMessage,
    panelChannel,
    interaction.guild!.id,
    logger
  );
  logger.info('Estado guardado');

  // PASO 13: Finalizar configuracion con actualizacion de presencia y estadisticas
  const { statsUpdated, elapsed } = await finalizeSetup(
    panelChannel,
    interaction.guild!,
    interaction.client,
    roleCountMessage,
    logger
  );
  logger.info('Setup finalizado');

  // PASO 14: Enviar mensaje de confirmacion al canal de control
  if (controlChannel) {
    try {
      // Obtener el conteo real de usuarios registrados
      const registeredUsers = await readPlayers(interaction.guild!.id);
      const userCount = registeredUsers.length;

      await controlChannel.send({
        content: `🎯 **Setup Roles Activado**

¡El sistema de rangos de Apex Legends ha sido configurado exitosamente!

**📍 Canal del Panel:** <#${panelChannel.id}>
**⏱️ Tiempo de Configuración:** ${elapsed} segundos
**👥 Usuarios Registrados:** ${userCount} ${userCount === 0 ? '(inicial)' : ''}
**📊 Estado:** ${statsUpdated ? '✅ Actualizado' : '⚠️ Error en estadísticas'}

**Información del Setup:**
- Panel interactivo creado en <#${panelChannel.name}>
- Mensajes de selección y estadísticas configurados
- Sistema de roles operativo
- Actualizaciones automáticas activadas

Los usuarios ya pueden seleccionar sus rangos en el panel. ¡Disfruta del bot! 🎮`,
      });
      logger.info('Mensaje de confirmación enviado al canal de control');
    } catch (error) {
      logger.warn(
        'No se pudo enviar mensaje de confirmación al canal de control:',
        error
      );
    }
  }

  // PASO 15: Respuesta final detallada
  return {
    content: `✅ **¡Configuracion completada en ${elapsed} segundos!**

📊 **Estadisticas:** ${
      statsUpdated ? '✅ Actualizadas' : '⚠️ Error - revisa logs'
    }
🔒 **Canal de Control:** ✅ Configurado (<#${
      controlChannel?.id || 'apex-bot-control'
    }>)
🎮 **Canal del Panel:** ✅ Configurado (<#${panelChannel.id}>)
🔄 **Presencia global actualizada**

🏆 ¡Listo para usar el panel de rangos!`,
    statsUpdated,
    elapsed,
  };
}
