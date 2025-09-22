import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  ChannelType,
  OverwriteResolvable,
} from 'discord.js';
import { DEFAULT_CONTROL_CHANNEL_NAME } from '../../models/constants';
import { findExistingControlChannel } from './find-existing-control-channel';
import { fixControlChannelPermissions } from './fix-control-channel-permissions';

/**
 * Crea o verifica el canal de control del bot con permisos restringidos.
 *
 * Este canal está diseñado para que solo el bot y los administradores puedan
 * enviar mensajes, evitando problemas de permisos en canales públicos.
 *
 * @param guild El servidor de Discord donde crear/verificar el canal
 * @param logger Logger para registrar operaciones
 * @param selectedChannel Canal específico seleccionado por el usuario (opcional)
 * @returns El canal de control creado o encontrado
 */
export async function createOrVerifyControlChannel(
  guild: Guild,
  logger: any,
  selectedChannel?: TextChannel,
  createChannels: boolean = true,
  customName?: string,
  modo?: string
): Promise<TextChannel> {
  logger.info('Verificando/creando canal de control del bot...');

  // Si se especificó un canal, usarlo directamente
  if (selectedChannel) {
    logger.info(
      `Usando canal de control especificado: #${selectedChannel.name} (${selectedChannel.id})`
    );

    // Verificar permisos del canal seleccionado
    const botPermissions = selectedChannel.permissionsFor(guild.members.me!);
    if (!botPermissions?.has(PermissionFlagsBits.SendMessages)) {
      logger.warn(
        'El canal seleccionado no tiene permisos adecuados para el bot'
      );
      // Intentar arreglar permisos
      await fixControlChannelPermissions(selectedChannel, logger);
    }

    // Enviar mensaje de confirmación
    try {
      await selectedChannel.send({
        content: `🤖 **Canal de Control Especificado**

Este canal ha sido seleccionado como canal de control para Apex Range.

**Estado:** ✅ Usando canal especificado
**Nombre:** #${selectedChannel.name}
**Permisos:** Verificados

El bot usará este canal para operaciones internas y logs.`,
      });
    } catch (error) {
      logger.warn(
        'No se pudo enviar mensaje de confirmación al canal especificado'
      );
    }

    return selectedChannel;
  }

  // Para modo manual, no buscar existente; intentar crear siempre
  if (modo === 'manual' && customName) {
    logger.info(
      `Modo manual: Intentando crear nuevo canal de control con nombre: ${customName}`
    );
  } else {
    // PASO 1: Buscar canal existente
    const existingChannel = await findExistingControlChannel(guild);
    if (existingChannel) {
      logger.info(
        `Canal de control encontrado: #${existingChannel.name} (${existingChannel.id})`
      );

      // Verificar permisos del canal existente
      const botPermissions = existingChannel.permissionsFor(guild.members.me!);
      if (!botPermissions?.has(PermissionFlagsBits.SendMessages)) {
        logger.warn(
          'El canal de control existente no tiene permisos adecuados para el bot'
        );
        // Intentar arreglar permisos
        await fixControlChannelPermissions(existingChannel, logger);
      }

      // Enviar mensaje de confirmación de uso
      try {
        await existingChannel.send({
          content: `🤖 **Canal de Control Detectado**

Este canal ha sido configurado como canal de control para Apex Range.

**Estado:** ✅ Usando canal existente
**Nombre:** #${existingChannel.name}
**Permisos:** Verificados

El bot usará este canal para operaciones internas y logs.`,
        });
      } catch (error) {
        logger.warn(
          'No se pudo enviar mensaje de confirmación al canal existente'
        );
      }

      return existingChannel;
    }
  }

  // Si no se permite crear canales y no hay uno existente, dar error
  if (!createChannels) {
    logger.error('No se permite crear canales y no se encontró uno existente');
    throw new Error(
      'No se encontró un canal de control existente y la creación automática está deshabilitada. ' +
        'Especifica un canal existente o permite la creación automática.'
    );
  }

  // PASO 2: Crear nuevo canal de control
  logger.info(
    'No se encontró canal de control existente, creando uno nuevo...'
  );

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
    // Definir permisos: solo admins y bot pueden enviar mensajes
    const permissionOverwrites: OverwriteResolvable[] = [
      {
        id: guild.id, // @everyone
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
        ],
      },
      {
        id: guild.members.me!.id, // El bot
        allow: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    // Agregar permisos para administradores
    const adminRole = guild.roles.cache.find((role) =>
      role.permissions.has(PermissionFlagsBits.Administrator)
    );
    if (adminRole) {
      permissionOverwrites.push({
        id: adminRole.id,
        allow: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    }

    let channelName = customName || DEFAULT_CONTROL_CHANNEL_NAME;
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

    const controlChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic:
        'Canal de control interno del bot Apex Range - Solo para administradores y el bot',
      permissionOverwrites,
      reason: 'Canal de control creado automáticamente por Apex Range Bot',
    });

    logger.info(
      `Canal de control creado: #${controlChannel.name} (${controlChannel.id})`
    );

    // Enviar mensaje de bienvenida
    await controlChannel.send({
      content: `🤖 **Canal de Control Creado**

¡Bienvenido al canal de control de Apex Range!

**Funciones:**
- 📋 Centro de logs y operaciones internas
- 🔧 Comando de administración del bot
- ⚠️ Notificaciones de errores y estado
- 🔒 Acceso restringido a admins y bot

**Nota:** Este canal es invisible para miembros normales y esencial para el funcionamiento del bot.`,
    });

    return controlChannel;
  } catch (error) {
    logger.error('Error creando canal de control:', error);
    throw new Error(
      'No se pudo crear el canal de control. Verifica los permisos del bot.'
    );
  }
}
