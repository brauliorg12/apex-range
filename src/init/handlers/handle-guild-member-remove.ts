import { Client } from 'discord.js';
import { readRolesState } from '../../utils/state-manager';
import { enqueueGuildUpdate } from '../../utils/guild-update-queue';
import { updateRoleCountMessage } from '../../utils/update-status-message';
import { updateBotPresence } from '../../utils/presence-helper';
import { logApp } from '../../utils/logger';

/**
 * Maneja cuando un miembro abandona un servidor configurado.
 * Actualiza las estadísticas y presencia del bot.
 *
 * @param client - El cliente de Discord.
 * @param member - El miembro que abandonó.
 */
export async function handleGuildMemberRemove(
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
  logApp(`[Evento] Miembro salió: ${member.user.tag} (${member.id})`);
}
