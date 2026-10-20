import type { Guild, TextChannel } from 'discord.js';
import { createApexStatusComponents } from '../../utils/apex-status-components';
import { notifyRecovery } from './notifications';
import { registerFailure, suspendRecovery } from './recovery';
import { cleanupDuplicateApexPanels } from './search';
import { persistApexState, rememberApexPanelMessage } from './state';
import type {
  ApexEmbeds,
  ApexLogger,
  StateWithGuild,
} from './types';

/**
 * Crea un panel nuevo, lo fija si hay permisos y guarda el nuevo ID.
 *
 * @param guild Guild del servidor.
 * @param channel Canal donde publicar.
 * @param state Estado actual.
 * @param embeds Embeds del panel.
 * @param logger Logger del guild.
 */
export async function recreatePanel(
  guild: Guild,
  channel: TextChannel,
  state: StateWithGuild,
  embeds: ApexEmbeds,
  logger: ApexLogger
): Promise<void> {
  try {
    const message = await channel.send({
      embeds,
      components: createApexStatusComponents(),
    });
    rememberApexPanelMessage(guild.id, message.id, channel.id);

    try {
      await message.pin();
    } catch (pinError: any) {
      logger.warn(
        'No se pudo fijar el panel de Apex recreado',
        pinError?.message ?? pinError
      );
    }

    const newState: StateWithGuild = {
      ...state,
      apexInfoMessageId: message.id,
      recoveryAttempts: 0,
      lastRecoveryAt: undefined,
      recoverySuspendedUntil: undefined,
    };

    const saved = await persistApexState(guild, newState, logger);
    if (!saved) {
      logger.error(
        'El panel de Apex se recreó pero no se pudo guardar el estado; se usará el ID en memoria'
      );
    }

    await cleanupDuplicateApexPanels(
      channel,
      message.id,
      guild.client.user?.id,
      logger
    );

    await notifyRecovery(
      guild,
      channel,
      'panel_recreated',
      `Nuevo mensaje: ${message.id}`,
      logger
    );
    logger.info(`Panel de Apex recreado y registrado: ${message.id}`);
  } catch (error: any) {
    await handleSendError(guild, channel, state, error, logger);
  }
}

/**
 * Maneja errores al crear un mensaje nuevo.
 *
 * @param guild Guild del servidor.
 * @param channel Canal donde se intento publicar.
 * @param state Estado actual.
 * @param error Error de Discord.
 * @param logger Logger del guild.
 */
async function handleSendError(
  guild: Guild,
  channel: TextChannel | null,
  state: StateWithGuild,
  error: any,
  logger: ApexLogger
): Promise<void> {
  if (error?.code === 10003) {
    logger.warn('El canal de Apex ya no existe al recrear el panel');
    await suspendRecovery(
      guild,
      null,
      state,
      logger,
      'channel_not_found',
      'El canal ya no existe.'
    );
    return;
  }

  if (error?.code === 50013 || error?.code === 50001) {
    logger.warn(
      'Falta de permisos para recrear el panel de Apex',
      error.message
    );
    await suspendRecovery(
      guild,
      channel,
      state,
      logger,
      'missing_permissions',
      error.message
    );
    return;
  }

  logger.error('Error creando el panel de Apex', error.message);
  await registerFailure(
    guild,
    channel,
    state,
    logger,
    error.message,
    'unknown'
  );
}

/**
 * Maneja errores al editar el mensaje existente.
 *
 * @param guild Guild del servidor.
 * @param channel Canal del panel.
 * @param state Estado actual.
 * @param embeds Embeds del panel.
 * @param error Error de Discord.
 * @param logger Logger del guild.
 */
export async function handleEditError(
  guild: Guild,
  channel: TextChannel,
  state: StateWithGuild,
  embeds: ApexEmbeds,
  error: any,
  logger: ApexLogger
): Promise<void> {
  if (error?.code === 10008) {
    logger.warn('Mensaje de Apex no encontrado; se recreará el panel');
    await recreatePanel(guild, channel, state, embeds, logger);
    return;
  }

  if (error?.code === 10003) {
    logger.warn('El canal de Apex ya no existe al editar el panel');
    await suspendRecovery(
      guild,
      null,
      state,
      logger,
      'channel_not_found',
      'El canal ya no existe.'
    );
    return;
  }

  if (error?.code === 50013 || error?.code === 50001) {
    logger.warn(
      'Falta de permisos para editar el mensaje de Apex',
      error.message
    );
    await suspendRecovery(
      guild,
      channel,
      state,
      logger,
      'missing_permissions',
      error.message
    );
    return;
  }

  logger.error('Error editando mensaje de Apex', error.message);
  await registerFailure(
    guild,
    channel,
    state,
    logger,
    error.message,
    'unknown'
  );
}
