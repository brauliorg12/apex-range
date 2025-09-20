import { Guild } from 'discord.js';
import { getServerLogger } from '../utils/server-logger';
import {
  readApexStatusState,
  writeApexStatusState,
} from '../utils/state-manager';
import { createApexStatusEmbeds } from '../utils/apex-status-embed';
import { notifyApexUpdateError } from '../utils/error-notifier';
import { fetchChannel } from '../utils/update-status-message';

/**
 * Actualiza el mensaje de información de Apex Legends en el canal configurado.
 * Lee el estado de Apex del guild, genera los embeds de estado y edita el mensaje correspondiente.
 * Maneja errores como permisos faltantes o mensaje no encontrado, limpiando el estado si es necesario.
 * @param guild El objeto Guild de Discord para el servidor donde se actualiza el mensaje.
 * @returns Una promesa que se resuelve cuando la actualización se completa.
 */
export async function updateApexInfoMessage(guild: Guild) {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);

  serverLogger.info('Iniciando actualización del mensaje de Apex');
  try {
    const apexStatusState = await readApexStatusState(guild.id);
    serverLogger.debug('Estado de Apex leído', apexStatusState);
    if (!apexStatusState?.channelId || !apexStatusState.apexInfoMessageId) {
      serverLogger.info(
        'No hay estado válido para actualizar Apex en este servidor'
      );
      return;
    }

    const channel = await fetchChannel(guild, apexStatusState.channelId);
    if (!channel) {
      serverLogger.warn(`Canal no encontrado: ${apexStatusState.channelId}`);
      return;
    }

    const embeds = await createApexStatusEmbeds(
      apexStatusState.guildId,
      apexStatusState.channelId
    );
    serverLogger.debug(`Embeds de Apex creados: ${embeds.length}`);

    try {
      await channel.messages.edit(apexStatusState.apexInfoMessageId, {
        embeds,
      });
      serverLogger.info('Mensaje de Apex editado exitosamente');
    } catch (error: any) {
      serverLogger.error('Error editando mensaje de Apex', error.message);
      if (error.code === 10008) {
        serverLogger.warn('Mensaje de Apex no encontrado, limpiando estado');
        const currentState = await readApexStatusState(guild.id);
        if (currentState) {
          await writeApexStatusState({
            ...currentState,
            apexInfoMessageId: undefined,
            guildId: guild.id,
          });
        }
        await notifyApexUpdateError(guild, channel, 'message_not_found');
      } else if (error.code === 50013) {
        // Missing Permissions
        serverLogger.warn('Falta de permisos para editar el mensaje de Apex');
        await notifyApexUpdateError(guild, channel, 'missing_permissions');
      } else {
        serverLogger.error('Error desconocido al actualizar Apex', error);
        await notifyApexUpdateError(guild, channel, 'unknown', error.message);
      }
    }
  } catch (error) {
    serverLogger.error('Error general al actualizar el mensaje de Apex', error);
  }
  const executionTime = Math.round(performance.now() - startTime);
  serverLogger.info(
    'Actualización del mensaje de Apex completada',
    executionTime
  );
}
