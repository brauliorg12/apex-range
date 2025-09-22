import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { DEFAULT_PANEL_CHANNEL_NAME } from '../../models/constants';
import { findExistingPanelChannel } from './find-existing-panel-channel';
import { fixPanelChannelPermissions } from './fix-panel-channel-permissions';

/**
 * Crea o verifica el canal del panel de rangos del bot.
 *
 * Este canal es público y visible para todos los miembros, donde se colocarán
 * los mensajes del panel de selección de rangos y estadísticas.
 *
 * @param guild El servidor de Discord donde crear/verificar el canal
 * @param logger Logger para registrar operaciones
 * @param controlChannel Canal de control para enviar notificaciones
 * @param selectedChannel Canal específico seleccionado por el usuario (opcional)
 * @param createChannels Si se permite crear canales automáticamente
 * @returns El canal del panel creado o encontrado
 */
export async function createOrVerifyPanelChannel(
  guild: Guild,
  logger: any,
  controlChannel?: TextChannel,
  selectedChannel?: TextChannel,
  createChannels: boolean = true,
  customName?: string,
  modo?: string
): Promise<TextChannel> {
  logger.info('Verificando/creando canal del panel de rangos...');

  // Si se especificó un canal, usarlo directamente
  if (selectedChannel) {
    logger.info(
      `Usando canal del panel especificado: #${selectedChannel.name} (${selectedChannel.id})`
    );

    // Verificar permisos del canal seleccionado
    const botPermissions = selectedChannel.permissionsFor(guild.members.me!);
    if (
      !botPermissions?.has([
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
      ])
    ) {
      logger.warn(
        'El canal seleccionado no tiene permisos adecuados para el bot'
      );
      // Intentar arreglar permisos básicos
      await fixPanelChannelPermissions(selectedChannel, logger);
    }

    // Enviar mensaje de confirmación al canal de control si está disponible
    if (controlChannel) {
      try {
        await controlChannel.send({
          content: `🎮 **Canal del Panel Especificado**

Este canal ha sido seleccionado como canal del panel para Apex Range.

**Estado:** ✅ Usando canal especificado
**Nombre:** #${selectedChannel.name}
**Tipo:** Panel de rangos público

El bot colocará aquí el panel de selección de rangos y estadísticas.`,
        });
      } catch (error) {
        logger.warn(
          'No se pudo enviar mensaje de confirmación al canal de control'
        );
      }
    }

    return selectedChannel;
  }

  // Para modo manual, no buscar existente; intentar crear siempre
  if (modo === 'manual' && customName) {
    logger.info(
      `Modo manual: Intentando crear nuevo canal del panel con nombre: ${customName}`
    );
  } else {
    // PASO 1: Buscar canal existente
    const existingChannel = await findExistingPanelChannel(guild);
    if (existingChannel) {
      logger.info(
        `Canal del panel encontrado: #${existingChannel.name} (${existingChannel.id})`
      );

      // Verificar permisos del canal existente
      const botPermissions = existingChannel.permissionsFor(guild.members.me!);
      if (
        !botPermissions?.has([
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
        ])
      ) {
        logger.warn(
          'El canal del panel existente no tiene permisos adecuados para el bot'
        );
        // Intentar arreglar permisos básicos
        await fixPanelChannelPermissions(existingChannel, logger);
      }

      // Enviar mensaje de confirmación de uso al canal de control si está disponible
      if (controlChannel) {
        try {
          await controlChannel.send({
            content: `🎮 **Canal del Panel Detectado**

Este canal ha sido configurado como canal del panel para Apex Range.

**Estado:** ✅ Usando canal existente
**Nombre:** #${existingChannel.name}
**Tipo:** Panel de rangos público

El bot colocará aquí el panel de selección de rangos y estadísticas.`,
          });
        } catch (error) {
          logger.warn(
            'No se pudo enviar mensaje de confirmación al canal de control'
          );
        }
      }

      return existingChannel;
    }
  }

  // Si no se permite crear canales, dar error
  if (!createChannels) {
    logger.error('No se permite crear canales y no se encontró uno existente');
    throw new Error(
      'No se encontró un canal del panel existente y la creación automática está deshabilitada. ' +
        'Especifica un canal existente o permite la creación automática.'
    );
  }

  // PASO 2: Crear nuevo canal del panel
  logger.info('No se encontró canal del panel existente, creando uno nuevo...');

  // Verificar permisos del bot antes de intentar crear el canal
  const botMember = guild.members.me!;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    logger.error(
      'El bot no tiene permisos para crear canales (ManageChannels)'
    );
    throw new Error(
      'El bot no tiene permisos para crear canales. ' +
        'Por favor, concede el permiso "Gestionar Canales" al bot en la configuración del servidor.'
    );
  }

  try {
    let channelName = customName || DEFAULT_PANEL_CHANNEL_NAME;
    if (modo === 'manual' && customName) {
      // Para modo manual, si el nombre ya existe, agregar sufijo para evitar duplicado
      const existing = guild.channels.cache.find(
        (ch) => ch.name === customName && ch.type === ChannelType.GuildText
      );
      if (existing) {
        channelName = `${customName}-manual`;
        logger.info(`Nombre duplicado, usando sufijo: ${channelName}`);
      }
    }

    const panelChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic:
        'Panel de rangos y estadísticas de Apex Legends - Gestionado por Apex Range Bot',
      reason: 'Canal del panel creado automáticamente por Apex Range Bot',
    });

    logger.info(
      `Canal del panel creado: #${panelChannel.name} (${panelChannel.id})`
    );

    return panelChannel;
  } catch (error) {
    logger.error('Error creando canal del panel:', error);
    throw new Error(
      'No se pudo crear el canal del panel. Verifica los permisos del bot.'
    );
  }
}
