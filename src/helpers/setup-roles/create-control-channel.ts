import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  ChannelType,
  OverwriteResolvable,
} from 'discord.js';

/**
 * Nombres posibles para el canal de control (por orden de prioridad)
 */
export const CONTROL_CHANNEL_NAMES = [
  'apex-bot-control',
  'bot-control',
  'apex-control',
  'control-bot',
  'admin-bot',
  'bot-admin',
];

/**
 * Busca un canal de control existente en el servidor.
 * Busca por nombres predefinidos y verifica permisos.
 *
 * @param guild El servidor de Discord
 * @returns El canal encontrado o null
 */
async function findExistingControlChannel(
  guild: Guild
): Promise<TextChannel | null> {
  for (const channelName of CONTROL_CHANNEL_NAMES) {
    const channel = guild.channels.cache.find(
      (ch) =>
        ch.name.toLowerCase() === channelName.toLowerCase() &&
        ch.type === ChannelType.GuildText
    ) as TextChannel;

    if (channel) {
      // Verificar que el bot puede enviar mensajes
      const botPermissions = channel.permissionsFor(guild.members.me!);
      if (botPermissions?.has(PermissionFlagsBits.SendMessages)) {
        return channel;
      }
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
 * @returns El canal de control creado o encontrado
 */
export async function createOrVerifyControlChannel(
  guild: Guild,
  logger: any
): Promise<TextChannel> {
  logger.info('Verificando/creando canal de control del bot...');

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

  // PASO 2: Crear nuevo canal de control
  logger.info(
    'No se encontró canal de control existente, creando uno nuevo...'
  );

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
      name: CONTROL_CHANNEL_NAMES[0], // Usar el nombre principal
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
 * Nombres posibles para el canal del panel de rangos (por orden de prioridad)
 */
export const PANEL_CHANNEL_NAMES = [
  'apex-rangos',
  'rangos-apex',
  'apex-ranks',
  'ranks-apex',
  'apex-panel',
  'panel-apex',
];

/**
 * Busca un canal de panel existente en el servidor.
 * Busca por nombres predefinidos y verifica permisos.
 *
 * @param guild El servidor de Discord
 * @returns El canal encontrado o null
 */
async function findExistingPanelChannel(
  guild: Guild
): Promise<TextChannel | null> {
  for (const channelName of PANEL_CHANNEL_NAMES) {
    const channel = guild.channels.cache.find(
      (ch) =>
        ch.name.toLowerCase() === channelName.toLowerCase() &&
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
 * @returns El canal del panel creado o encontrado
 */
export async function createOrVerifyPanelChannel(
  guild: Guild,
  logger: any,
  controlChannel?: TextChannel
): Promise<TextChannel> {
  logger.info('Verificando/creando canal del panel de rangos...');

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

  // PASO 2: Crear nuevo canal del panel
  logger.info('No se encontró canal del panel existente, creando uno nuevo...');

  try {
    const panelChannel = await guild.channels.create({
      name: PANEL_CHANNEL_NAMES[0], // Usar el nombre principal
      type: ChannelType.GuildText,
      topic:
        'Panel de rangos y estadísticas de Apex Legends - Gestionado por Apex Range Bot',
      reason: 'Canal del panel creado automáticamente por Apex Range Bot',
    });

    logger.info(
      `Canal del panel creado: #${panelChannel.name} (${panelChannel.id})`
    );

    // Enviar mensaje de confirmación al canal de control si está disponible
    if (controlChannel) {
      try {
        await controlChannel.send({
          content: `🎮 **Canal del Panel Creado**

Canal del panel creado exitosamente: #${panelChannel.name}`,
        });
      } catch (error) {
        logger.warn(
          'No se pudo enviar mensaje de confirmación al canal de control'
        );
      }
    }

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
