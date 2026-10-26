import { Guild } from 'discord.js';
import { enqueueGuildUpdate } from '../utils/guild-update-queue';
import { runHeavyTask } from '../utils/heavy-task-queue';
import {
  loadRankCardRefreshContext,
  refreshRankCards,
  refreshRankCardsForGuild,
} from './refresh-rank-cards';

/** Rangos con refresco pendiente por guild. */
const pendingRankCards = new Map<string, Set<string>>();

/** Miembros con cambio de presencia pendiente por guild. */
const pendingPresenceMembers = new Map<string, Set<string>>();

/**
 * Acumula valores pendientes por guild.
 *
 * @param pendingByGuild - Mapa de pendientes a actualizar.
 * @param guildId - El ID único del servidor de Discord.
 * @param values - Valores a agregar.
 * @returns `true` si quedó al menos un valor pendiente.
 */
function addPending(
  pendingByGuild: Map<string, Set<string>>,
  guildId: string,
  values: Iterable<string>
): boolean {
  const next = new Set(values);
  if (next.size === 0) return false;

  let pending = pendingByGuild.get(guildId);
  if (!pending) {
    pending = new Set<string>();
    pendingByGuild.set(guildId, pending);
  }

  for (const value of next) {
    pending.add(value);
  }

  return true;
}

/**
 * Solicita un refresco coalescido de cards para los rangos indicados.
 *
 * Los pedidos se acumulan por guild y un único trabajo encolado drena todos los
 * rangos pendientes con un solo snapshot. No crea timers. El refresco se ejecuta
 * en la cola serial de trabajo pesado.
 *
 * @param guild - Servidor de Discord.
 * @param rankShortIds - Rangos afectados.
 * @param priority - Prioridad de la cola de updates.
 */
export function requestRankCardRefresh(
  guild: Guild,
  rankShortIds: Iterable<string>,
  priority: number = 1
): void {
  if (!addPending(pendingRankCards, guild.id, rankShortIds)) return;

  enqueueGuildUpdate(
    guild,
    async () => {
      const queuedRanks = pendingRankCards.get(guild.id);
      if (!queuedRanks || queuedRanks.size === 0) return;

      pendingRankCards.delete(guild.id);
      await runHeavyTask(() =>
        refreshRankCardsForGuild(guild, queuedRanks)
      );
    },
    'rank-cards',
    priority
  );
}

/**
 * Solicita un refresco coalescido del card del rango actual de un miembro.
 *
 * El rango se resuelve recién cuando el trabajo encolado se ejecuta, usando el
 * estado de roles actual del miembro y el resolvedor canónico. El refresco se
 * ejecuta en la cola serial de trabajo pesado.
 *
 * @param guild - Servidor de Discord.
 * @param userId - ID del miembro cuya presencia cambió.
 * @param priority - Prioridad de la cola de updates.
 */
export function requestPresenceCardRefresh(
  guild: Guild,
  userId: string,
  priority: number = 1
): void {
  if (!addPending(pendingPresenceMembers, guild.id, [userId])) return;

  enqueueGuildUpdate(
    guild,
    async () => {
      const userIds = pendingPresenceMembers.get(guild.id);
      if (!userIds || userIds.size === 0) return;

      pendingPresenceMembers.delete(guild.id);

      await runHeavyTask(async () => {
        const context = await loadRankCardRefreshContext(guild);
        if (!context) return;

        const ranks = new Set<string>();
        for (const pendingUserId of userIds) {
          const member = guild.members.cache.get(pendingUserId);
          if (!member) continue;

          const highest = context.resolver.pickHighest(
            member.roles.cache.values()
          );
          if (highest) {
            ranks.add(highest.shortId);
          }
        }

        if (ranks.size > 0) {
          await refreshRankCards(guild, context, ranks);
        }
      });
    },
    'presence-cards',
    priority
  );
}

/**
 * Descarta los refrescos pendientes de un guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 */
export function forgetRankCardRefreshes(guildId: string): void {
  pendingRankCards.delete(guildId);
  pendingPresenceMembers.delete(guildId);
}
