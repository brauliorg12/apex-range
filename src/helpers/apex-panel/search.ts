import type { Guild, Message, TextChannel } from 'discord.js';
import { fetchChannel } from '../../utils/update-status-message';
import {
  CLEANUP_INTERVAL_MS,
  PANEL_SEARCH_LIMIT,
} from './constants';
import type { ApexLogger } from './types';

const lastCleanupAt = new Map<string, number>();

/**
 * Elimina el estado de limpieza de duplicados de un guild.
 *
 * @param guildId ID del guild.
 */
export function forgetApexPanelSearchState(guildId: string): void {
  lastCleanupAt.delete(guildId);
}

/**
 * Identifica un panel de Apex por el titulo del embed principal.
 *
 * @param message Mensaje a evaluar.
 * @param botId ID del bot.
 * @returns `true` si es un panel de Apex del bot.
 */
function isApexPanelMessage(message: Message, botId: string): boolean {
  return (
    message.author.id === botId &&
    message.embeds.some(
      (embed) =>
        !!embed.title && embed.title.includes('Información de Apex Legends')
    )
  );
}

/**
 * Busca el panel mas reciente del bot en el canal.
 * Se usa cuando el estado perdió el `apexInfoMessageId` pero el mensaje sigue vivo.
 *
 * @param channel Canal donde buscar.
 * @param botId ID del bot.
 * @returns ID del panel mas reciente o `null`.
 */
export async function findExistingApexPanel(
  channel: TextChannel,
  botId?: string
): Promise<string | null> {
  if (!botId) return null;

  const findNewest = (messages: Iterable<Message>): Message | null => {
    let newest: Message | null = null;

    for (const message of messages) {
      if (!isApexPanelMessage(message, botId)) continue;
      if (!newest || message.createdTimestamp > newest.createdTimestamp) {
        newest = message;
      }
    }

    return newest;
  };

  try {
    const recentPanel = findNewest(
      (await channel.messages.fetch({ limit: PANEL_SEARCH_LIMIT })).values()
    );
    if (recentPanel) return recentPanel.id;
  } catch {
    // Sin acceso al historial; se intenta con los fijados.
  }

  try {
    const pinnedMessages = await channel.messages.fetchPins();
    const pinnedPanel = findNewest(
      pinnedMessages.items.map((pin) => pin.message)
    );
    if (pinnedPanel) return pinnedPanel.id;
  } catch {
    // Si no se pueden leer los fijados, se recreara el panel.
  }

  return null;
}

/**
 * Elimina paneles de Apex duplicados en el canal, conservando el canonico.
 * Solo borra mensajes del bot que coincidan con el panel de `/apex-status`.
 * No toca los mensajes de setup-roles ni otros embeds.
 *
 * @param channel Canal donde limpiar.
 * @param canonicalMessageId ID del panel que se conserva.
 * @param botId ID del bot.
 * @param logger Logger del guild.
 */
export async function cleanupDuplicateApexPanels(
  channel: TextChannel,
  canonicalMessageId: string,
  botId: string | undefined,
  logger: ApexLogger
): Promise<void> {
  if (!botId) return;

  const duplicates = new Map<string, Message>();

  const collect = (messages: Iterable<Message>): void => {
    for (const message of messages) {
      if (
        message.id !== canonicalMessageId &&
        isApexPanelMessage(message, botId)
      ) {
        duplicates.set(message.id, message);
      }
    }
  };

  try {
    const pinnedMessages = await channel.messages.fetchPins();
    collect(pinnedMessages.items.map((pin) => pin.message));
  } catch {
    // Sin acceso a fijados; se intenta con los recientes.
  }

  try {
    collect(
      (await channel.messages.fetch({ limit: PANEL_SEARCH_LIMIT })).values()
    );
  } catch {
    // Sin acceso al historial; no se pueden limpiar duplicados.
  }

  for (const [messageId, message] of duplicates) {
    try {
      await message.delete();
      logger.info(`Panel de Apex duplicado eliminado: ${messageId}`);
    } catch (error: any) {
      logger.warn(
        'No se pudo eliminar un panel de Apex duplicado',
        `${messageId}: ${error?.message ?? error}`
      );
    }
  }
}

/**
 * Elimina el panel anterior cuando `/apex-status` se ejecuta en otro canal.
 * Solo borra el mensaje canónico anterior; los demás duplicados del canal
 * anterior se limpian al ejecutar el comando en ese canal.
 *
 * @param guild Guild del servidor.
 * @param previousChannelId Canal del panel anterior.
 * @param previousMessageId Mensaje canónico anterior.
 * @param currentChannelId Canal actual.
 * @param logger Logger del guild.
 */
export async function deletePreviousApexPanel(
  guild: Guild,
  previousChannelId: string | undefined,
  previousMessageId: string | undefined,
  currentChannelId: string,
  logger: ApexLogger
): Promise<void> {
  if (
    !previousChannelId ||
    !previousMessageId ||
    previousChannelId === currentChannelId
  ) {
    return;
  }

  try {
    const channel = await fetchChannel(guild, previousChannelId);
    if (!channel || !channel.isTextBased()) return;

    const message = await channel.messages
      .fetch(previousMessageId)
      .catch(() => null);

    if (!message) return;

    await message.delete();
    logger.info(
      `Panel de Apex anterior eliminado: ${previousChannelId}/${previousMessageId}`
    );
  } catch (error: any) {
    logger.warn(
      'No se pudo eliminar el panel de Apex anterior',
      `${previousChannelId}/${previousMessageId}: ${error?.message ?? error}`
    );
  }
}

/**
 * Limpia duplicados como maximo una vez por hora por guild.
 *
 * @param guildId ID del guild.
 * @param channel Canal donde limpiar.
 * @param canonicalMessageId ID del panel que se conserva.
 * @param botId ID del bot.
 * @param logger Logger del guild.
 */
export async function maybeCleanupDuplicateApexPanels(
  guildId: string,
  channel: TextChannel,
  canonicalMessageId: string,
  botId: string | undefined,
  logger: ApexLogger
): Promise<void> {
  const now = Date.now();
  const lastCleanup = lastCleanupAt.get(guildId) ?? 0;

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanupAt.set(guildId, now);
  await cleanupDuplicateApexPanels(
    channel,
    canonicalMessageId,
    botId,
    logger
  );
}
