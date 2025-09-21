import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  ChannelType,
  OverwriteResolvable,
} from 'discord.js';
import {
  DEFAULT_CONTROL_CHANNEL_NAME,
  DEFAULT_PANEL_CHANNEL_NAME,
} from '../../models/constants';

/**
 * Busca un canal de control existente en el servidor.
 * Busca por el nombre por defecto y verifica permisos.
 *
 * @param guild El servidor de Discord
 * @returns El canal encontrado o null
 */
async function findExistingControlChannel(
  guild: Guild
): Promise<TextChannel | null> {
  const channel = guild.channels.cache.find(
    (ch) =>
      ch.name.toLowerCase() === DEFAULT_CONTROL_CHANNEL_NAME.toLowerCase() &&
      ch.type === ChannelType.GuildText
  ) as TextChannel;

  if (channel) {
    // Verificar que el bot puede enviar mensajes
    const botPermissions = channel.permissionsFor(guild.members.me!);
    if (botPermissions?.has(PermissionFlagsBits.SendMessages)) {
      return channel;
    }
  }
  return null;
}

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
  customName?: string
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

    const controlChannel = await guild.channels.create({
      name: customName || DEFAULT_CONTROL_CHANNEL_NAME, // Usar nombre personalizado o por defecto
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

/**
 * Corrige los permisos del canal de control si están mal configurados
 */
async function fixControlChannelPermissions(
  channel: TextChannel,
  logger: any
): Promise<void> {
  logger.info('Corrigiendo permisos del canal de control...');

  try {
    const permissionOverwrites: OverwriteResolvable[] = [
      {
        id: channel.guild.id, // @everyone
        deny: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
        ],
      },
      {
        id: channel.guild.members.me!.id, // El bot
        allow: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    // Agregar permisos para administradores
    const adminRole = channel.guild.roles.cache.find((role) =>
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

    await channel.edit({
      permissionOverwrites,
    });

    logger.info('Permisos del canal de control corregidos');
  } catch (error) {
    logger.error('Error corrigiendo permisos del canal de control:', error);
  }
}

/**
 * Busca un canal de panel existente en el servidor.
 * Busca por el nombre por defecto y verifica permisos.
 *
 * @param guild El servidor de Discord
 * @returns El canal encontrado o null
 */
async function findExistingPanelChannel(
  guild: Guild
): Promise<TextChannel | null> {
  const channel = guild.channels.cache.find(
    (ch) =>
      ch.name.toLowerCase() === DEFAULT_PANEL_CHANNEL_NAME.toLowerCase() &&
      ch.type === ChannelType.GuildText
  ) as TextChannel;

  if (channel) {
    // Verificar que el bot puede enviar mensajes y ver el canal
    const botPermissions = channel.permissionsFor(guild.members.me!);
    if (
      botPermissions?.has([
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ViewChannel,
      ])
    ) {
      return channel;
    }
  }
  return null;
}

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
  customName?: string
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
    const panelChannel = await guild.channels.create({
      name: customName || DEFAULT_PANEL_CHANNEL_NAME, // Usar nombre personalizado o por defecto
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

/**
 * Corrige los permisos básicos del canal del panel si están mal configurados
 */
async function fixPanelChannelPermissions(
  channel: TextChannel,
  logger: any
): Promise<void> {
  logger.info('Corrigiendo permisos del canal del panel...');

  try {
    // Para el panel, asegurarse de que @everyone pueda ver y el bot pueda enviar
    const permissionOverwrites: OverwriteResolvable[] = [
      {
        id: channel.guild.id, // @everyone
        allow: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: channel.guild.members.me!.id, // El bot
        allow: [
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ];

    await channel.edit({
      permissionOverwrites,
    });

    logger.info('Permisos del canal del panel corregidos');
  } catch (error) {
    logger.error('Error corrigiendo permisos del canal del panel:', error);
  }
}
