import { Client } from 'discord.js';
import { readRolesState } from '../../utils/state-manager';
import { APEX_RANKS, APEX_PLATFORMS } from '../../models/constants';
import { logApp } from '../../utils/logger';
import { enqueueGuildUpdate } from '../../utils/guild-update-queue';
import { updateRoleCountMessage } from '../../utils/update-status-message';
import { updateBotPresence } from '../../utils/presence-helper';
import { updateRankCardMessage } from '../../helpers/update-rank-card-message';
import {
  updatePlayerRankDate,
  getPlayerPlatform,
  updatePlayerPlatform,
} from '../../utils/player-data-manager';

/**
 * Maneja cambios en miembros de servidores configurados, especialmente cambios de roles de Apex Legends.
 *
 * Esta función se activa cuando un miembro de un servidor Discord configurado cambia sus roles.
 * Se enfoca en detectar y procesar cambios en roles relacionados con Apex Legends, como rangos
 * (Bronce, Plata, Oro, etc.) y plataformas (PC, PlayStation, Xbox, Nintendo Switch).
 * Al detectar un cambio relevante, actualiza los datos persistentes del jugador, registra el evento
 * en los logs y encola una actualización asíncrona para refrescar los embeds de estadísticas,
 * mensajes de conteo de roles y la presencia global del bot.
 *
 * **Flujo de ejecución:**
 * 1. **Validación inicial**: Verifica que el miembro pertenezca a un guild y que el guild esté configurado
 *    con datos de roles (rolesState). Si no, termina la ejecución.
 * 2. **Detección de cambios de roles**: Compara los roles antiguos y nuevos del miembro. Si no hay cambios,
 *    termina la ejecución.
 * 3. **Filtrado de roles Apex**: Identifica roles relacionados con Apex Legends (rangos y plataformas)
 *    en los sets de roles antiguos y nuevos. Si no hay cambios en estos roles específicos, termina.
 * 4. **Determinación del tipo de cambio**: Analiza si cambió el rango, la plataforma o ambos, comparando
 *    los subconjuntos de roles de rango y plataforma.
 * 5. **Actualización de datos del jugador**:
 *    - Si cambió el rango: Actualiza la fecha de asignación, el shortId del rango (o vacío si se removió)
 *      y mantiene la plataforma actual. Registra el cambio en logs.
 *    - Si cambió solo la plataforma: Actualiza la plataforma usando el apiName correspondiente.
 *      Registra el cambio en logs.
 * 6. **Encoleo de actualización asíncrona**: Programa una tarea de alta prioridad para refrescar:
 *    - El mensaje de conteo de roles del guild.
 *    - La presencia global del bot.
 *    - Los mensajes de tarjetas de rango afectados en el canal configurado.
 *
 * Esta función asegura la consistencia entre los roles asignados manualmente en Discord y los datos
 * persistentes del bot, permitiendo que los embeds y estadísticas reflejen cambios en tiempo real
 * sin necesidad de reinicios o comandos manuales.
 *
 * @param client - El cliente de Discord, utilizado para acceder a datos globales y actualizar presencia.
 * @param oldMember - El objeto GuildMember representando el estado del miembro antes del cambio.
 * @param newMember - El objeto GuildMember representando el estado del miembro después del cambio.
 * @returns Promise que se resuelve cuando se completa el manejo del evento (incluyendo encolado de actualizaciones).
 *
 * @example
 * // Se llama automáticamente por el evento GuildMemberUpdate de Discord.js
 * client.on('guildMemberUpdate', (oldMember, newMember) => {
 *   handleGuildMemberUpdate(client, oldMember, newMember);
 * });
 */
export async function handleGuildMemberUpdate(
  client: Client,
  oldMember: any,
  newMember: any
): Promise<void> {
  // Paso 1: Validación inicial - Verificar que el miembro pertenezca a un guild y que esté configurado
  if (!newMember.guild) return;

  const rolesState = await readRolesState(newMember.guild.id);
  if (!rolesState) return;

  // Paso 2: Detección de cambios de roles - Comparar roles antiguos y nuevos
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  if (oldRoles.equals(newRoles)) return; // No hay cambios en roles

  // Paso 3: Filtrado de roles Apex - Identificar cambios en roles de rango y plataforma
  const apexRoleNames = APEX_RANKS.map((rank) => rank.roleName);
  const platformRoleNames = APEX_PLATFORMS.map((platform) => platform.roleName);
  const allApexRoleNames = [...apexRoleNames, ...platformRoleNames];

  const oldApexRoles = oldRoles.filter((role: any) =>
    allApexRoleNames.includes(role.name)
  );
  const newApexRoles = newRoles.filter((role: any) =>
    allApexRoleNames.includes(role.name)
  );

  // Si no hay cambios en roles de Apex (rank o plataforma), no hacer nada
  if (oldApexRoles.equals(newApexRoles)) return;

  logApp(
    `GuildMemberUpdate: ${newMember.user.tag} (${newMember.id}) cambió roles de Apex (rank/plataforma) en guild ${newMember.guild.name} (${newMember.guild.id})`
  );

  // Paso 4: Determinación del tipo de cambio - Analizar si cambió rango, plataforma o ambos
  const oldRankRoles = oldRoles.filter((role: any) =>
    apexRoleNames.includes(role.name)
  );
  const newRankRoles = newRoles.filter((role: any) =>
    apexRoleNames.includes(role.name)
  );

  const oldPlatformRoles = oldRoles.filter((role: any) =>
    platformRoleNames.includes(role.name)
  );
  const newPlatformRoles = newRoles.filter((role: any) =>
    platformRoleNames.includes(role.name)
  );

  // Paso 5: Actualización de datos del jugador - Procesar cambios en rango y/o plataforma
  let rankChanged = !oldRankRoles.equals(newRankRoles);
  let platformChanged = !oldPlatformRoles.equals(newPlatformRoles);

  if (rankChanged || platformChanged) {
    // Si cambió el rank, actualizar fecha y rank
    if (rankChanged) {
      let newRank: string | undefined;
      if (newRankRoles.size > 0) {
        const newRankRole = newRankRoles.first();
        const rankInfo = APEX_RANKS.find(
          (r) => r.roleName === newRankRole.name
        );
        newRank = rankInfo?.shortId;
      } else {
        // Rank removido
        newRank = '';
      }

      const currentPlatform = await getPlayerPlatform(
        newMember.guild.id,
        newMember.id
      );
      await updatePlayerRankDate(
        newMember.guild.id,
        newMember.id,
        newRank,
        currentPlatform
      );

      logApp(
        `Player rank updated: ${newMember.user.tag} - Rank: ${newRank}, Platform: ${currentPlatform}`
      );
    }

    // Si cambió solo la plataforma, actualizar solo la plataforma
    if (platformChanged && !rankChanged) {
      if (newPlatformRoles.size > 0) {
        const newPlatformRole = newPlatformRoles.first();
        const platformInfo = APEX_PLATFORMS.find(
          (p) => p.roleName === newPlatformRole.name
        );
        if (platformInfo) {
          await updatePlayerPlatform(
            newMember.guild.id,
            newMember.id,
            platformInfo.apiName
          );

          logApp(
            `Player platform updated: ${newMember.user.tag} - Platform: ${platformInfo.apiName}`
          );
        }
      }
    }
  }

  // Paso 6: Encolado de actualización asíncrona - Refrescar embeds, estadísticas y presencia
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
