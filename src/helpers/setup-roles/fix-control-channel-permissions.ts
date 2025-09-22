import {
  TextChannel,
  PermissionFlagsBits,
  OverwriteResolvable,
} from 'discord.js';

/**
 * Corrige los permisos del canal de control si están mal configurados
 */
export async function fixControlChannelPermissions(
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
