import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { DEFAULT_PANEL_CHANNEL_NAME } from '../../models/constants';

/**
 * Busca un canal de panel existente en el servidor.
 * Busca por el nombre por defecto y verifica permisos.
 *
 * @param guild El servidor de Discord
 * @returns El canal encontrado o null
 */
export async function findExistingPanelChannel(
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
