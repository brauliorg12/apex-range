import { Client } from 'discord.js';
import { readRolesState } from '../../utils/state-manager';
import { enqueueGuildUpdate } from '../../utils/guild-update-queue';
import { updateRoleCountMessage } from '../../utils/update-status-message';
import { updateBotPresence } from '../../utils/presence-helper';
import { logApp } from '../../utils/logger';

/**
 * Maneja cambios en la presencia de miembros en servidores configurados.
 * Solo actualiza si el estado de presencia realmente cambió.
 *
 * @param client - El cliente de Discord.
 * @param oldPresence - La presencia anterior.
 * @param newPresence - La nueva presencia.
 */
export async function handlePresenceUpdate(
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

    // Log deshabilitado para evitar spam en servidores grandes
    // Si necesitas debuggear, descomenta temporalmente:
    // logApp(
    //   `PresenceUpdate: ${newPresence.user?.tag ?? ''} (${
    //     newPresence.user?.id ?? ''
    //   }) cambió de ${oldStatus} a ${newStatus} en guild ${
    //     newPresence.guild.name
    //   } (${newPresence.guild.id})`
    // );
  }
}
