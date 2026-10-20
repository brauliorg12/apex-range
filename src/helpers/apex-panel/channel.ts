import type { Guild, TextChannel } from 'discord.js';
import { fetchChannel } from '../../utils/update-status-message';
import { suspendRecovery } from './recovery';
import type { ApexLogger, StateWithGuild } from './types';

/**
 * Obtiene el canal configurado y valida que sea textual.
 * Si el canal no existe o el bot no tiene acceso, suspende la recuperacion.
 *
 * @param guild Guild del servidor.
 * @param channelId ID del canal configurado.
 * @param state Estado de Apex del guild.
 * @param logger Logger del guild.
 * @returns El canal o `null` si no se puede usar.
 */
export async function fetchApexChannel(
  guild: Guild,
  channelId: string,
  state: StateWithGuild,
  logger: ApexLogger
): Promise<TextChannel | null> {
  try {
    const channel = await fetchChannel(guild, channelId);

    if (!channel || !channel.isTextBased() || !('send' in channel)) {
      logger.warn(`Canal de Apex inválido o no utilizable: ${channelId}`);
      await suspendRecovery(
        guild,
        null,
        state,
        logger,
        'channel_not_found',
        `Canal inválido o no utilizable: ${channelId}`
      );
      return null;
    }

    return channel as TextChannel;
  } catch (error: any) {
    if (error.code === 10003) {
      logger.warn(`Canal de Apex no encontrado: ${channelId}`);
      await suspendRecovery(
        guild,
        null,
        state,
        logger,
        'channel_not_found',
        `Canal: ${channelId}`
      );
    } else if (error.code === 50001 || error.code === 50013) {
      logger.warn(`Sin acceso al canal de Apex: ${channelId}`);
      await suspendRecovery(
        guild,
        null,
        state,
        logger,
        'missing_permissions',
        error.message
      );
    } else {
      logger.error('Error obteniendo el canal de Apex', error);
    }

    return null;
  }
}
