import { Client } from 'discord.js';
import { readRolesState } from '../../utils/state-manager';
import { APEX_RANKS } from '../../models/constants';
import { logApp } from '../../utils/logger';
import { enqueueGuildUpdate } from '../../utils/guild-update-queue';
import { updateRoleCountMessage } from '../../utils/update-status-message';
import { updateBotPresence } from '../../utils/presence-helper';
import { updateRankCardMessage } from '../../helpers/update-rank-card-message';

/**
 * Maneja cambios en miembros de servidores configurados, especialmente cambios de roles.
 * Actualiza los embeds de canvas y estadísticas cuando se asignan/quitan roles de Apex manualmente.
 *
 * @param client - El cliente de Discord.
 * @param oldMember - El miembro antes del cambio.
 * @param newMember - El miembro después del cambio.
 */
export async function handleGuildMemberUpdate(
  client: Client,
  oldMember: any,
  newMember: any
): Promise<void> {
  if (!newMember.guild) return;

  const rolesState = await readRolesState(newMember.guild.id);
  if (!rolesState) return;

  // Verificar si los roles cambiaron
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  if (oldRoles.equals(newRoles)) return; // No hay cambios en roles

  // Verificar si se agregó o quitó algún rol de Apex
  const apexRoleNames = APEX_RANKS.map((rank) => rank.roleName);
  const oldApexRoles = oldRoles.filter((role: any) =>
    apexRoleNames.includes(role.name)
  );
  const newApexRoles = newRoles.filter((role: any) =>
    apexRoleNames.includes(role.name)
  );

  // Si no hay cambios en roles de Apex, no hacer nada
  if (oldApexRoles.equals(newApexRoles)) return;

  logApp(
    `GuildMemberUpdate: ${newMember.user.tag} (${newMember.id}) cambió roles de Apex en guild ${newMember.guild.name} (${newMember.guild.id})`
  );

  // Actualizar estadísticas generales
  enqueueGuildUpdate(
    newMember.guild,
    async () => {
      await updateRoleCountMessage(newMember.guild);
      await updateBotPresence(client);

      // Actualizar cards de rangos afectados
      const channel = newMember.guild.channels.cache.get(
        rolesState.channelId
      ) as any;
      if (channel) {
        // Actualizar todos los rangos que podrían haber cambiado
        for (const rank of APEX_RANKS) {
          const rankMessageId = rolesState.rankCardMessageIds?.[rank.shortId];
          if (rankMessageId) {
            await updateRankCardMessage(
              newMember.guild,
              channel,
              rank.shortId,
              rankMessageId
            );
          }
        }
      }
    },
    3 // Alta prioridad para cambios de roles
  );
}
