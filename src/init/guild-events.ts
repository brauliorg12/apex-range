import { Client, Events } from 'discord.js';
import { handleGuildMemberAdd } from './handlers/handle-guild-member-add';
import { handleGuildMemberRemove } from './handlers/handle-guild-member-remove';
import { handlePresenceUpdate } from './handlers/handle-presence-update';
import { handleGuildMemberUpdate } from './handlers/handle-guild-member-update';

/**
 * Configura los eventos globales relacionados con guilds.
 * Incluye eventos de miembros y presencia que requieren actualizaciones coalescidas.
 *
 * @param client - El cliente de Discord.
 */
export function setupGuildEvents(client: Client): void {
  // Evento cuando un nuevo miembro se une al servidor
  client.on(Events.GuildMemberAdd, async (member) => {
    await handleGuildMemberAdd(client, member);
  });

  // Evento cuando un miembro abandona el servidor
  client.on(Events.GuildMemberRemove, async (member) => {
    await handleGuildMemberRemove(client, member);
  });

  // Evento cuando cambia la presencia de un miembro
  client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    await handlePresenceUpdate(client, oldPresence, newPresence);
  });

  // Evento cuando cambia algo en un miembro (incluyendo roles)
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    await handleGuildMemberUpdate(client, oldMember, newMember);
  });
}
