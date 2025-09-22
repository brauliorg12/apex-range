import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  OverwriteResolvable,
} from 'discord.js';

/**
 * Corrige los permisos básicos del canal del panel si están mal configurados
 */
export async function fixPanelChannelPermissions(
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
