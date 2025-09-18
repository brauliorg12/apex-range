import { Client, Events } from 'discord.js';
import { readRolesState } from '../utils/state-manager';
import { updateRoleCountMessage } from '../utils/update-status-message';
import { updateBotPresence } from '../utils/presence-helper';
import { logApp } from '../utils/logger';
import { enqueueGuildUpdate } from '../utils/guild-update-queue';

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
}

/**
 * Maneja cuando un nuevo miembro se une a un servidor configurado.
 * Actualiza las estadísticas y presencia del bot.
 *
 * @param client - El cliente de Discord.
 * @param member - El miembro que se unió.
 */
async function handleGuildMemberAdd(
  client: Client,
  member: any
): Promise<void> {
  const rolesState = await readRolesState(member.guild.id);
  if (!rolesState) return;

  enqueueGuildUpdate(
    member.guild,
    async () => {
      await updateRoleCountMessage(member.guild);
      await updateBotPresence(client);
    },
    2
  ); // Alta prioridad para eventos de miembros

  logApp(
    `Nuevo miembro: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
  );
  console.log(`[Evento] Nuevo miembro: ${member.user.tag} (${member.id})`);
}

/**
 * Maneja cuando un miembro abandona un servidor configurado.
 * Actualiza las estadísticas y presencia del bot.
 *
 * @param client - El cliente de Discord.
 * @param member - El miembro que abandonó.
 */
async function handleGuildMemberRemove(
  client: Client,
  member: any
): Promise<void> {
  const rolesState = await readRolesState(member.guild.id);
  if (!rolesState) return;

  enqueueGuildUpdate(
    member.guild,
    async () => {
      await updateRoleCountMessage(member.guild);
      await updateBotPresence(client);
    },
    2
  ); // Alta prioridad

  logApp(
    `Miembro salió: ${member.user.tag} (${member.id}) en guild ${member.guild.name} (${member.guild.id})`
  );
  console.log(`[Evento] Miembro salió: ${member.user.tag} (${member.id})`);
}

/**
 * Maneja cambios en la presencia de miembros en servidores configurados.
 * Solo actualiza si el estado de presencia realmente cambió.
 *
 * @param client - El cliente de Discord.
 * @param oldPresence - La presencia anterior.
 * @param newPresence - La nueva presencia.
 */
async function handlePresenceUpdate(
  client: Client,
  oldPresence: any,
  newPresence: any
): Promise<void> {
  if (!newPresence.guild) return;

  const rolesState = await readRolesState(newPresence.guild.id);
  if (!rolesState) return;

  const oldStatus = oldPresence?.status;
  const newStatus = newPresence.status;

  if (oldStatus !== newStatus) {
    enqueueGuildUpdate(
      newPresence.guild,
      async () => {
        await updateRoleCountMessage(newPresence.guild);
        await updateBotPresence(client);
      },
      1
    ); // Prioridad normal para presencia

    logApp(
      `PresenceUpdate: ${newPresence.user?.tag ?? ''} (${
        newPresence.user?.id ?? ''
      }) cambió de ${oldStatus} a ${newStatus} en guild ${
        newPresence.guild.name
      } (${newPresence.guild.id})`
    );
  }
}
