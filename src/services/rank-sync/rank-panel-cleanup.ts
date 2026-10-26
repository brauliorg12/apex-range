import { Guild, Message, TextChannel } from 'discord.js';
import { RolesState } from '../../interfaces/bot-state';
import { getServerLogger } from '../../utils/server-logger';
import { RankPanelCollectionResult } from './rank-panel-types';

// #region Constantes

/** Prefijo de los adjuntos que identifican a los cards de rango. */
const CARD_ATTACHMENT_PREFIX = 'rankcard_';

// #endregion

// #region Helpers

/**
 * Recolecta los IDs de los mensajes que forman el panel activo según el estado.
 *
 * @param state - Estado persistido del panel, o `null` si no existe.
 * @returns El conjunto de IDs del panel activo.
 */
export function getActivePanelMessageIds(
  state: RolesState | null
): Set<string> {
  const ids = new Set<string>();

  for (const messageId of Object.values(state?.rankCardMessageIds ?? {})) {
    ids.add(messageId);
  }
  if (state?.rankPanelHeaderMessageId) {
    ids.add(state.rankPanelHeaderMessageId);
  }
  if (state?.rankPanelManagementMessageId) {
    ids.add(state.rankPanelManagementMessageId);
  }

  return ids;
}

/**
 * Recolecta los IDs del estado, incluidos los retirados pendientes de borrado.
 *
 * @param state - Estado persistido del panel, o `null` si no existe.
 * @returns El conjunto de IDs aportados por el estado.
 */
function getStatePanelMessageIds(state: RolesState | null): Set<string> {
  const ids = getActivePanelMessageIds(state);

  for (const messageId of state?.rankPanelRetiredMessageIds ?? []) {
    ids.add(messageId);
  }

  return ids;
}

/**
 * Indica si un mensaje corresponde a un card de rango.
 *
 * @param message - Mensaje del canal.
 * @returns `true` si tiene el adjunto o la imagen de un card de rango.
 */
function isRankPanelCardMessage(message: Message): boolean {
  const hasCardAttachment = message.attachments.some((attachment) =>
    attachment.name.startsWith(CARD_ATTACHMENT_PREFIX)
  );
  if (hasCardAttachment) return true;

  return message.embeds.some((embed) =>
    (embed.image?.url ?? '').startsWith('attachment://rankcard_')
  );
}

/**
 * Clasifica un mensaje del canal como parte del panel o como ajeno.
 *
 * @param message - Mensaje del canal.
 * @returns El tipo de mensaje del panel, o `null` si no pertenece al panel.
 */
function getPanelMessageKind(
  message: Message
): 'header' | 'management' | 'card' | null {
  const description = message.embeds[0]?.description ?? '';

  if (description.includes('Jugadores por Rango')) return 'header';
  if (description.includes('Panel de Gestión')) return 'management';
  if (isRankPanelCardMessage(message)) return 'card';

  return null;
}

// #endregion

// #region Limpieza

/**
 * Recolecta los IDs de todos los mensajes del panel que encuentre en el estado
 * y en el canal.
 *
 * El fallback revisa los mensajes alrededor de los cards persistidos y los
 * últimos 100 mensajes del canal. Recolecta todos los headers, paneles de
 * gestión y cards encontrados, no solo el primero, y devuelve avisos cuando no
 * puede leer el historial o no encuentra los anclajes esperados.
 *
 * @param channel - Canal donde está publicado el panel.
 * @param guild - Guild al que pertenece el canal.
 * @param state - Estado persistido del panel, o `null` si no existe.
 * @returns Los IDs únicos, los conteos por origen y los avisos del fallback.
 */
export async function collectOldPanelMessageIds(
  channel: TextChannel,
  guild: Guild,
  state: RolesState | null
): Promise<RankPanelCollectionResult> {
  const logger = getServerLogger(guild.id, guild.name);
  const ids = getStatePanelMessageIds(state);
  const hadActivePanel = getActivePanelMessageIds(state).size > 0;
  const fromState = ids.size;
  const fallbackIds = new Set<string>();
  const warnings: string[] = [];
  let foundHeader = Boolean(state?.rankPanelHeaderMessageId);
  let foundManagement = Boolean(state?.rankPanelManagementMessageId);
  let duplicateCount = 0;
  const botUserId = guild.client.user?.id;

  if (!botUserId) {
    warnings.push(
      'No se pudo identificar al bot para limpiar mensajes viejos del panel.'
    );
  } else {
    const cardIds = Object.values(state?.rankCardMessageIds ?? {});
    const anchors = [
      ...new Set(
        [cardIds[0], cardIds[cardIds.length - 1]].filter(
          (id): id is string => Boolean(id)
        )
      ),
    ];

    const addMatches = (messages: Map<string, Message>): void => {
      for (const message of messages.values()) {
        if (message.author.id !== botUserId) continue;

        const kind = getPanelMessageKind(message);
        if (!kind) continue;

        if (kind === 'header') foundHeader = true;
        if (kind === 'management') foundManagement = true;

        if (!ids.has(message.id)) {
          ids.add(message.id);
          fallbackIds.add(message.id);
        } else {
          duplicateCount++;
        }
      }
    };

    let anchorReadFailures = 0;

    for (const anchor of anchors) {
      try {
        const messages = await channel.messages.fetch({
          around: anchor,
          limit: 50,
        });
        addMatches(messages);
      } catch {
        anchorReadFailures++;
      }
    }

    if (anchorReadFailures > 0) {
      logger.debug(
        `[rank-panel] ${anchorReadFailures} anclajes de cards no se pudieron leer.`
      );
    }

    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      addMatches(messages);
    } catch {
      warnings.push(
        'No se pudo leer el historial del canal para limpiar mensajes viejos ' +
          'del panel. Revisá los permisos del canal.'
      );
    }

    if (hadActivePanel && !foundHeader) {
      warnings.push(
        'No se encontró el header del panel viejo en el canal; puede quedar ' +
          'un mensaje sin limpiar.'
      );
    }
    if (hadActivePanel && !foundManagement) {
      warnings.push(
        'No se encontró el panel de gestión viejo en el canal; puede quedar ' +
          'un mensaje sin limpiar.'
      );
    }
  }

  logger.debug(
    `[rank-panel] Recolección: estado=${fromState} ` +
      `fallback=${fallbackIds.size} duplicados=${duplicateCount} ` +
      `total=${ids.size} avisos=${warnings.length}`
  );
  for (const warning of warnings) {
    logger.warn(`[rank-panel] ${warning}`);
  }

  return {
    messageIds: [...ids],
    fromState,
    fromFallback: fallbackIds.size,
    warnings,
  };
}

// #endregion
