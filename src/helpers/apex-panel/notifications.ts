import { EmbedBuilder } from 'discord.js';
import type { Guild, TextChannel } from 'discord.js';
import { notifyApexUpdateError } from '../../utils/error-notifier';
import { sendToControlChannel } from '../../utils/control-channel-helper';
import { RECOVERY_ALERT_COOLDOWN_MS } from './constants';
import type { ApexLogger, ApexNotifyType } from './types';

export interface ApexCommandNotification {
  guild: Guild;
  userTag: string;
  userId: string;
  newChannelId: string;
  newMessageId: string;
  previousChannelId?: string;
  previousMessageId?: string;
  moved: boolean;
  statePersisted: boolean;
}

const lastRecoveryAlertAt = new Map<string, number>();

/**
 * Elimina el estado de cooldown de avisos de un guild.
 *
 * @param guildId ID del guild.
 */
export function forgetApexPanelNotifications(guildId: string): void {
  lastRecoveryAlertAt.delete(guildId);
}

/**
 * Envia una notificacion de recuperacion al canal de control o al owner.
 * Aplica cooldown para limitar la frecuencia de avisos transitorios.
 *
 * @param guild Guild donde ocurrio el evento.
 * @param channel Canal del panel, o `null` si no esta disponible.
 * @param type Tipo de evento.
 * @param details Detalle para el embed/log.
 * @param logger Logger del guild.
 */
export async function notifyRecovery(
  guild: Guild,
  channel: TextChannel | null,
  type: ApexNotifyType,
  details: string,
  logger: ApexLogger
): Promise<void> {
  const now = Date.now();
  const lastAlertAt = lastRecoveryAlertAt.get(guild.id) ?? 0;
  const isTerminal =
    type === 'recovery_suspended' ||
    type === 'channel_not_found' ||
    type === 'missing_permissions';

  if (!isTerminal && now - lastAlertAt < RECOVERY_ALERT_COOLDOWN_MS) {
    logger.debug(
      `Aviso de recuperación de Apex omitido por cooldown (${type})`
    );
    return;
  }

  lastRecoveryAlertAt.set(guild.id, now);

  if (channel) {
    try {
      await notifyApexUpdateError(guild, channel, type, details);
    } catch (error) {
      logger.error(
        'No se pudo enviar la notificación de recuperación de Apex',
        error
      );
    }
    return;
  }

  await notifyWithoutChannel(guild, type, details, logger);
}

/**
 * Notifica una ejecucion exitosa de `/apex-status` al canal de control o al
 * owner. Incluye usuario, canal nuevo, canal anterior e IDs de los mensajes.
 *
 * @param context Datos de la ejecucion del comando.
 * @param logger Logger del guild.
 */
export async function notifyApexPanelCommand(
  context: ApexCommandNotification,
  logger: ApexLogger
): Promise<void> {
  const embed = new EmbedBuilder()
    .setTitle('Panel de Apex actualizado')
    .setColor(context.moved ? 0xffa500 : 0x00ff00)
    .addFields(
      {
        name: 'Usuario',
        value: `${context.userTag} (${context.userId})`,
        inline: false,
      },
      {
        name: 'Canal nuevo',
        value: `<#${context.newChannelId}> (${context.newChannelId})`,
        inline: false,
      },
      {
        name: 'Canal anterior',
        value: context.previousChannelId
          ? `<#${context.previousChannelId}> (${context.previousChannelId})`
          : 'Sin registro previo',
        inline: false,
      },
      {
        name: 'Mensaje anterior',
        value: context.previousMessageId ?? 'Sin registro previo',
        inline: false,
      },
      {
        name: 'Mensaje nuevo',
        value: context.newMessageId,
        inline: false,
      },
      {
        name: 'Resultado',
        value: context.moved
          ? 'El panel se movió a otro canal'
          : 'Panel actualizado en el mismo canal',
        inline: false,
      },
      {
        name: 'Estado persistido',
        value: context.statePersisted
          ? 'Sí'
          : 'No; se usa el ID confirmado en memoria',
        inline: false,
      }
    )
    .setTimestamp();

  const sentToControl = await sendToControlChannel(context.guild, '', {
    embeds: [embed],
  });

  if (sentToControl) {
    logger.info('Notificación de /apex-status enviada al canal de control');
    return;
  }

  try {
    const owner = await context.guild.fetchOwner();
    await owner.send({ embeds: [embed] });
    logger.info('Notificación de /apex-status enviada por DM al owner');
  } catch (error) {
    logger.error(
      'No se pudo enviar la notificación de /apex-status al owner',
      error
    );
  }
}

/**
 * Alternativa cuando no hay un canal de panel disponible para notificar.
 * Intenta el canal de control y, si no existe, el DM del owner.
 * No publica nada en canales publicos.
 *
 * @param guild Guild donde ocurrio el evento.
 * @param type Tipo de evento.
 * @param details Detalle para el aviso.
 * @param logger Logger del guild.
 */
async function notifyWithoutChannel(
  guild: Guild,
  type: ApexNotifyType,
  details: string,
  logger: ApexLogger
): Promise<void> {
  const text = [
    `⚠️ **Apex Range** - ${type}`,
    `Servidor: ${guild.name} (${guild.id})`,
    details,
  ].join('\n');

  const sentToControl = await sendToControlChannel(guild, text);
  if (sentToControl) {
    logger.info('Aviso de Apex enviado al canal de control');
    return;
  }

  try {
    const owner = await guild.fetchOwner();
    await owner.send(text);
    logger.info('Aviso de Apex enviado por DM al owner');
  } catch (error) {
    logger.error('No se pudo enviar el aviso de Apex al owner', error);
  }
}
