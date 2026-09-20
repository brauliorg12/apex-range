import {
  MessageFlags,
  TextChannel,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ChannelType,
} from 'discord.js';
import { cleanupExistingMessages } from '../cleanup-existing-messages';
import {
  createRoleSelectionMessage,
  createStatsMessage,
  saveSetupState,
  finalizeSetup,
} from '../setup-roles';
import { writeBotControlState, readPlayers } from '../../utils/state-manager';
import {
  DEFAULT_CONTROL_CHANNEL_NAME,
  DEFAULT_PANEL_CHANNEL_NAME,
} from '../../models/constants';
import { createOrVerifyControlChannel } from './create-verify-control-channel';
import { createOrVerifyPanelChannel } from './create-verify-panel-channel';
import { createSetupCompletedEmbed } from './setup-embeds';

/**
 * Funcion que ejecuta el setup completo despues de la confirmacion
 * @param channel El canal donde configurar
 * @param interaction La interaccion original
 * @param logger El logger del servidor
 * @param options Opciones adicionales del comando (opcional)
 */
export async function performSetup(
  channel: TextChannel,
  interaction: ChatInputCommandInteraction | ButtonInteraction,
  logger: any,
  options?: any
) {
  logger.info('=== INICIANDO performSetup ===');
  logger.info(`Canal: ${channel.name} (${channel.id})`);
  logger.info(
    `Tipo de interacción: ${
      interaction.isChatInputCommand()
        ? 'ChatInputCommand'
        : 'ButtonInteraction'
    }`
  );
  logger.info(`Opciones recibidas: ${JSON.stringify(options)}`);

  // Obtener canal de control seleccionado si se especificó
  let selectedControlChannel: TextChannel | undefined;
  if (interaction.isChatInputCommand()) {
    const modo = interaction.options.getString('modo');
    if (modo === 'existente') {
      const controlChannelOption = interaction.options.getChannel(
        'canal_admin_existente'
      );
      if (
        controlChannelOption &&
        controlChannelOption.type === ChannelType.GuildText
      ) {
        selectedControlChannel = controlChannelOption as TextChannel;
        logger.info(
          `Canal de control especificado por usuario: #${selectedControlChannel.name}`
        );
      }
    }
  } else if (options?.controlChannelId) {
    // Para ButtonInteraction, obtener canal desde opciones deserializadas
    selectedControlChannel = interaction.guild!.channels.cache.get(
      options.controlChannelId
    ) as TextChannel;
    if (selectedControlChannel) {
      logger.info(
        `Canal de control especificado por usuario: #${selectedControlChannel.name}`
      );
    }
  }

  // Obtener canal del panel seleccionado si se especificó
  let selectedPanelChannel: TextChannel | undefined;
  if (interaction.isChatInputCommand()) {
    const modo = interaction.options.getString('modo');
    if (modo === 'existente') {
      const panelChannelOption = interaction.options.getChannel(
        'canal_publico_existente'
      );
      if (
        panelChannelOption &&
        panelChannelOption.type === ChannelType.GuildText
      ) {
        selectedPanelChannel = panelChannelOption as TextChannel;
        logger.info(
          `Canal del panel especificado por usuario: #${selectedPanelChannel.name}`
        );
      }
    }
  } else if (options?.panelChannelId) {
    // Para ButtonInteraction, obtener canal desde opciones deserializadas
    selectedPanelChannel = interaction.guild!.channels.cache.get(
      options.panelChannelId
    ) as TextChannel;
    if (selectedPanelChannel) {
      logger.info(
        `Canal del panel especificado por usuario: #${selectedPanelChannel.name}`
      );
    }
  }

  // Obtener nombres personalizados para canales
  let controlChannelName = DEFAULT_CONTROL_CHANNEL_NAME; // Por defecto
  let panelChannelName = DEFAULT_PANEL_CHANNEL_NAME; // Por defecto
  let modo = 'auto'; // Por defecto automático

  if (interaction.isChatInputCommand()) {
    const modoOption = interaction.options.getString('modo');
    if (modoOption) {
      modo = modoOption;
      logger.info(`Modo seleccionado: ${modo}`);
    }

    if (modo === 'manual') {
      const controlNameOption = interaction.options.getString('canal_admin');
      const panelNameOption = interaction.options.getString('canal_publico');

      if (controlNameOption) {
        controlChannelName = controlNameOption;
        logger.info(
          `Nombre personalizado para canal de control: ${controlChannelName}`
        );
      }

      if (panelNameOption) {
        panelChannelName = panelNameOption;
        logger.info(
          `Nombre personalizado para canal del panel: ${panelChannelName}`
        );
      }
    } else if (modo === 'auto') {
      logger.info('Modo automático: usando nombres predeterminados');
    } else if (modo === 'existente') {
      logger.info('Modo existente: usando canales seleccionados');
    }
  } else if (options) {
    // Para ButtonInteraction, usar opciones deserializadas
    if (options.modo) {
      modo = options.modo;
      logger.info(`Modo desde botón: ${modo}`);
    }

    if (modo === 'manual') {
      if (options.canal_admin) {
        controlChannelName = options.canal_admin;
        logger.info(
          `Nombre personalizado para canal de control: ${controlChannelName}`
        );
      }
      if (options.canal_publico) {
        panelChannelName = options.canal_publico;
        logger.info(
          `Nombre personalizado para canal del panel: ${panelChannelName}`
        );
      }
    } else {
      logger.info('Modo automático/existente desde botón');
    }
  }

  // Obtener opción de crear canales (siempre true en la nueva lógica)
  let createChannels = true; // Siempre crear canales en la nueva versión
  logger.info('Creación de canales activada (nueva lógica simplificada)');

  // PASO 8: Crear/verificar canal de control del bot
  let controlChannel: TextChannel | undefined;
  try {
    logger.info('PASO 8: Creando/verificando canal de control...');
    controlChannel = await createOrVerifyControlChannel(
      interaction.guild!,
      logger,
      selectedControlChannel,
      createChannels,
      controlChannelName,
      options.modo
    );
    logger.info('PASO 8: Canal de control creado/verificado exitosamente');

    // Guardar estado del canal de control
    await writeBotControlState({
      controlChannelId: controlChannel.id,
      guildId: interaction.guild!.id,
    });
    logger.info('PASO 8: Estado del canal de control guardado');
  } catch (error) {
    logger.error('PASO 8: Error con canal de control:', error);
    // Continuar sin canal de control, pero loggear el problema
    controlChannel = undefined;
    await interaction.followUp({
      content:
        '⚠️ No se pudo crear/verificar el canal de control. El bot funcionara, pero algunas operaciones podrian tener problemas de permisos.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // PASO 9: Crear/verificar canal del panel de rangos
  let panelChannel: TextChannel;
  try {
    logger.info('PASO 9: Creando/verificando canal del panel...');
    panelChannel = await createOrVerifyPanelChannel(
      interaction.guild!,
      logger,
      controlChannel, // Puede ser undefined si falló la creación
      selectedPanelChannel,
      createChannels,
      panelChannelName,
      options.modo
    );
    logger.info('PASO 9: Canal del panel creado/verificado exitosamente');
  } catch (error) {
    logger.error('PASO 9: Error con canal del panel:', error);
    // No usar el canal actual como fallback - dar error
    await interaction.followUp({
      content:
        '❌ **Error crítico**: No se pudo crear el canal del panel. ' +
        'Verifica que el bot tenga permisos de **ManageChannels** en el servidor.',
      flags: MessageFlags.Ephemeral,
    });
    throw error; // Detener el setup
  }

  // PASO 10: Limpiar mensajes existentes
  await cleanupExistingMessages(panelChannel, logger);
  logger.info('PASO 10: Mensajes existentes limpiados');

  // PASO 11: Crear mensajes de seleccion de rango y estadisticas
  const roleSelectionMessage = await createRoleSelectionMessage(
    panelChannel,
    logger
  );
  const roleCountMessage = await createStatsMessage(panelChannel, logger);
  logger.info('PASO 11: Mensajes de seleccion y estadisticas creados');

  // PASO 12: Guardar estado de la configuracion
  await saveSetupState(
    roleCountMessage,
    roleSelectionMessage,
    panelChannel,
    interaction.guild!.id,
    logger
  );
  logger.info('PASO 12: Estado guardado');

  // PASO 13: Finalizar configuracion con actualizacion de presencia y estadisticas
  const { statsUpdated, elapsed } = await finalizeSetup(
    panelChannel,
    interaction.guild!,
    interaction.client,
    roleCountMessage,
    logger
  );
  logger.info('PASO 13: Setup finalizado');

  // PASO 14: Enviar mensaje de confirmacion al canal de control
  if (controlChannel) {
    try {
      // Obtener el conteo real de usuarios registrados
      const registeredUsers = await readPlayers(interaction.guild!.id);
      const userCount = registeredUsers.length;

      await controlChannel.send(
        createSetupCompletedEmbed(
          panelChannel,
          elapsed,
          userCount,
          statsUpdated
        )
      );
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
