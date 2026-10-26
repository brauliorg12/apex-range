import { Client, Events, Guild, Role } from 'discord.js';
import { readRolesStateStrict } from '../../utils/state-manager';
import { notifyCorruptStateAlert } from '../../utils/admin-alert';
import { enqueueRankSync } from './rank-sync';
import { isRankRoleEventSuppressed } from './rank-event-state';

/** Ventana de debounce para agrupar eventos de roles seguidos. */
const DEBOUNCE_MS = 5_000;
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Cancela el debounce pendiente de una guild eliminada.
 *
 * @param guildId - ID de la guild que se removió.
 */
export function forgetRankSyncEvents(guildId: string): void {
  const timer = timers.get(guildId);
  if (timer) clearTimeout(timer);
  timers.delete(guildId);
}

/**
 * Agenda una sincronización con debounce si el guild tiene panel configurado.
 *
 * Un archivo ausente es un skip normal. Si `.bot-state` está corrupto o es
 * ilegible, alerta al administrador de la app con el throttle compartido y no
 * agenda el sync, sin depender de que el rank sync llegue a ejecutarse.
 *
 * @param guild - Guild cuyo evento de rol se recibió.
 * @param reason - Motivo que se reporta en el sync.
 * @param createMissingRoles - Si el sync puede crear roles faltantes.
 */
async function scheduleRankSync(
  guild: Guild,
  reason: string,
  createMissingRoles: boolean
): Promise<void> {
  const stateResult = await readRolesStateStrict(guild.id);
  if (stateResult.status === 'missing') return;

  if (stateResult.status !== 'ok') {
    await notifyCorruptStateAlert({
      guildId: guild.id,
      guildName: guild.name,
      errorType: stateResult.status,
    });
    return;
  }

  if (!stateResult.state.channelId) return;

  const existing = timers.get(guild.id);
  if (existing) clearTimeout(existing);

  timers.set(
    guild.id,
    setTimeout(() => {
      timers.delete(guild.id);
      enqueueRankSync(guild, { reason, createMissingRoles });
    }, DEBOUNCE_MS)
  );
}

/**
 * Escucha cambios manuales de roles y agenda una sincronización con debounce.
 * No actúa sobre guilds sin panel configurado.
 *
 * @param client - Cliente de Discord donde se registran los listeners.
 */
export function setupRankEvents(client: Client): void {
  client.on(Events.GuildRoleCreate, (role: Role) => {
    if (isRankRoleEventSuppressed(role.id)) return;
    void scheduleRankSync(role.guild, 'role-create', true);
  });

  client.on(Events.GuildRoleUpdate, (oldRole: Role, newRole: Role) => {
    // Los cambios de posición no modifican el nombre y no requieren sync.
    // Un renombrado manual se procesa aunque el rol lo haya creado el sync.
    if (oldRole.name === newRole.name) return;
    void scheduleRankSync(newRole.guild, 'role-update', false);
  });

  client.on(Events.GuildRoleDelete, (role: Role) => {
    void scheduleRankSync(role.guild, 'role-delete', false);
  });
}
