import { Guild, TextChannel } from 'discord.js';
import { readBotControlState } from './state-manager';

/**
 * Obtiene el canal de control del bot para un servidor.
 * Si no existe o no se puede acceder, retorna null.
 *
 * @param guild El servidor de Discord
 * @returns El canal de control o null si no existe/no accesible
 */
export async function getControlChannel(
  guild: Guild
): Promise<TextChannel | null> {
  try {
    const controlState = await readBotControlState(guild.id);
    if (!controlState?.controlChannelId) {
      return null;
    }

    const channel = guild.channels.cache.get(
      controlState.controlChannelId
    ) as TextChannel;
    if (!channel) {
      return null;
    }

    // Verificar que el bot puede enviar mensajes
    const botPermissions = channel.permissionsFor(guild.members.me!);
    if (!botPermissions?.has('SendMessages')) {
      return null;
    }

    return channel;
  } catch (error) {
    console.error('Error obteniendo canal de control:', error);
    return null;
  }
}

/**
 * Envía un mensaje al canal de control del bot.
 * Si no hay canal de control o hay error, el mensaje se ignora silenciosamente.
 *
 * @param guild El servidor de Discord
 * @param content El contenido del mensaje
 * @param options Opciones adicionales para el mensaje (embeds, etc.)
 */
export async function sendToControlChannel(
  guild: Guild,
  content: string,
  options?: any
): Promise<void> {
  try {
    const controlChannel = await getControlChannel(guild);
    if (!controlChannel) {
      return; // Silenciosamente ignorar si no hay canal
    }

    await controlChannel.send({ content, ...options });
  } catch (error) {
    console.error('Error enviando mensaje al canal de control:', error);
    // No lanzar error para no interrumpir operaciones principales
  }
}

/**
 * Registra un evento importante en el canal de control.
 * Útil para logs de operaciones críticas del bot.
 *
 * @param guild El servidor de Discord
 * @param event El tipo de evento (ej: 'setup-completed', 'error-occurred')
 * @param details Detalles del evento
 * @param logger Logger opcional para registro adicional
 */
export async function logToControlChannel(
  guild: Guild,
  event: string,
  details: string,
  logger?: any
): Promise<void> {
  const timestamp = new Date().toISOString();
  const message = `📋 **${event.toUpperCase()}** - ${timestamp}\n${details}`;

  await sendToControlChannel(guild, message);

  if (logger) {
    logger.info(`Log enviado al canal de control: ${event}`);
  }
}
