import { Guild, TextChannel } from 'discord.js';
import { readRolesState, updateRolesState } from './state-manager';
import { getServerLogger } from './server-logger';
import { runHeavyTask } from './heavy-task-queue';
import { isUnknownChannelError } from './message-reference';
import { updateRoleStatsMessages } from '../helpers/role-stats-message';
import {
  loadRankCardRefreshContext,
  refreshRankCards,
} from '../helpers/refresh-rank-cards';
import type { RolesState } from '../interfaces/bot-state';
import type { ServerLogger } from './server-logger';

// Map para encadenar actualizaciones secuenciales por guild
const updateLocks = new Map<string, Promise<void>>();

/** Estado y canal necesarios para actualizar el panel. */
interface PanelTarget {
  /** Estado de roles del guild. */
  rolesState: RolesState;
  /** Canal configurado del panel. */
  channel: TextChannel;
}

/**
 * Obtiene un canal de texto específico de un servidor de Discord.
 * @param guild El objeto Guild de Discord.js que representa el servidor.
 * @param channelId El ID del canal a buscar.
 * @returns Una promesa que resuelve a un TextChannel.
 */
export async function fetchChannel(guild: Guild, channelId: string) {
  return (await guild.channels.fetch(channelId)) as TextChannel;
}

/**
 * Serializa una actualización del panel por guild y limpia el lock al terminar.
 *
 * El trabajo pesado se encola globalmente para evitar picos de CPU entre guilds
 * e interacciones. Un fallo previo no bloquea las siguientes actualizaciones;
 * el error se propaga al llamador que originó la tarea.
 *
 * @param guild - Servidor de Discord.
 * @param task - Actualización que se ejecuta en orden.
 * @returns Una promesa que se resuelve cuando la tarea termina.
 */
function enqueuePanelUpdate(
  guild: Guild,
  task: () => Promise<void>
): Promise<void> {
  const guildId = guild.id;
  const previous = updateLocks.get(guildId) ?? Promise.resolve();
  const run = previous
    .catch(() => undefined)
    .then(() => runHeavyTask(task));
  updateLocks.set(guildId, run);

  return run.finally(() => {
    if (updateLocks.get(guildId) === run) {
      updateLocks.delete(guildId);
    }
  });
}

/**
 * Lee el estado y resuelve el canal del panel.
 *
 * Si el canal configurado ya no existe, limpia solo las referencias del panel
 * para forzar un setup nuevo.
 *
 * @param guild - Servidor de Discord.
 * @param serverLogger - Logger del guild.
 * @returns El estado y canal listos, o `null` si no se puede actualizar.
 */
async function loadPanelTarget(
  guild: Guild,
  serverLogger: ServerLogger
): Promise<PanelTarget | null> {
  serverLogger.debug('Leyendo estado de roles...');
  const rolesState = await readRolesState(guild.id);
  if (
    !rolesState?.channelId ||
    !rolesState.roleCountMessageId ||
    !rolesState.roleSelectionMessageId
  ) {
    serverLogger.warn('Estado de roles incompleto:', {
      hasChannelId: !!rolesState?.channelId,
      hasRoleCountMessageId: !!rolesState?.roleCountMessageId,
      hasRoleSelectionMessageId: !!rolesState?.roleSelectionMessageId,
    });
    return null;
  }

  serverLogger.debug('Obteniendo canal...');
  try {
    const channel = await fetchChannel(guild, rolesState.channelId);
    return { rolesState, channel };
  } catch (error) {
    if (isUnknownChannelError(error)) {
      serverLogger.warn(
        'El canal configurado ya no existe. Limpiando estado de roles para forzar re-setup.'
      );
      await updateRolesState(guild.id, () => ({
        channelId: undefined,
        roleCountMessageId: undefined,
        roleSelectionMessageId: undefined,
        rankCardMessageIds: undefined,
      }));
      return null;
    }

    serverLogger.error('Error al obtener el canal:', error);
    return null;
  }
}

/**
 * Ejecuta un refresco completo o por rangos afectados.
 *
 * Lee estado y canal una vez, actualiza las estadísticas y reutiliza un único
 * snapshot de jugadores para todos los cards.
 *
 * @param guild - Servidor de Discord.
 * @param rankShortIds - Rangos afectados; si se omite, todos los cards.
 * @param force - Fuerza la edición aunque el fingerprint coincida.
 */
async function performPanelUpdate(
  guild: Guild,
  rankShortIds?: readonly string[],
  force: boolean = false
): Promise<void> {
  const startTime = performance.now();
  const serverLogger = getServerLogger(guild.id, guild.name);
  serverLogger.info('Ejecutando actualización de mensajes de roles');

  try {
    const target = await loadPanelTarget(guild, serverLogger);
    if (!target) return;

    await updateRoleStatsMessages(
      guild,
      target.rolesState,
      target.channel,
      serverLogger
    );

    if (target.rolesState.rankCardMessageIds) {
      const context = await loadRankCardRefreshContext(
        guild,
        target.rolesState,
        target.channel
      );
      if (context) {
        await refreshRankCards(guild, context, rankShortIds, force);
      }
    }

    const executionTime = Math.round(performance.now() - startTime);
    serverLogger.info(
      'Actualización de mensajes de roles completada',
      executionTime
    );
  } catch (error) {
    serverLogger.error(
      'Error al actualizar el mensaje de conteo de roles:',
      error
    );
    throw error;
  }
}

/**
 * Actualiza los mensajes de selección de roles, estadísticas y cards de rangos
 * en el canal configurado.
 *
 * Todas las actualizaciones del guild se serializan. Por defecto refresca todos
 * los cards; si se indican rangos, actualiza solo esos cards y las estadísticas.
 * Un error no deja el lock tomado para siempre.
 *
 * @param guild - Servidor de Discord donde se actualizan los mensajes.
 * @param rankShortIds - Rangos afectados; si se omite, todos.
 * @param force - Fuerza la edición de todos los cards afectados.
 * @returns Una promesa que se resuelve cuando la actualización termina.
 */
export async function updateRoleCountMessage(
  guild: Guild,
  rankShortIds?: Iterable<string>,
  force: boolean = false
): Promise<void> {
  const targets =
    rankShortIds === undefined ? undefined : Array.from(rankShortIds);

  return enqueuePanelUpdate(guild, () =>
    performPanelUpdate(guild, targets, force)
  );
}
