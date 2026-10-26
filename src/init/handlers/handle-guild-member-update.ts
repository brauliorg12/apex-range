import { readRolesState } from '../../utils/state-manager';
import { logApp } from '../../utils/logger';
import {
  updatePlayerRankDate,
  getPlayerPlatform,
  updatePlayerPlatform,
} from '../../utils/player-data-manager';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';
import { getApexPlatformsForGuild } from '../../helpers/get-apex-platforms-for-guild';
import { buildRankResolver } from '../../helpers/rank-priority';
import { requestRankCardRefresh } from '../../helpers/rank-card-refresh-queue';

/**
 * Maneja cambios en miembros de servidores configurados, especialmente cambios de roles de Apex Legends.
 *
 * Esta función se activa cuando un miembro de un servidor Discord configurado cambia sus roles.
 * Se enfoca en detectar y procesar cambios en roles relacionados con Apex Legends, como rangos
 * (Bronce, Plata, Oro, etc.) y plataformas (PC, PlayStation, Xbox, Nintendo Switch).
 * Al detectar un cambio relevante, actualiza los datos persistentes del jugador, registra el evento
 * en los logs y solicita un refresco coalescido de los cards de los rangos afectados. Las
 * estadísticas y la presencia global quedan a cargo del scheduler.
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
 * 6. **Refresco de cards**: Solicita a la cola un refresco coalescido de los cards de los rangos
 *    anterior y nuevo. No recalcula estadísticas ni presencia global por evento.
 *
 * Esta función asegura la consistencia entre los roles asignados manualmente en Discord y los datos
 * persistentes del bot, permitiendo que los cards de rango reflejen los cambios sin necesidad de
 * reinicios o comandos manuales.
 *
 * @param oldMember - El objeto GuildMember representando el estado del miembro antes del cambio.
 * @param newMember - El objeto GuildMember representando el estado del miembro después del cambio.
 * @returns Promise que se resuelve cuando se completa el manejo del evento (incluyendo encolado de actualizaciones).
 *
 * @example
 * // Se llama automáticamente por el evento GuildMemberUpdate de Discord.js
 * client.on('guildMemberUpdate', (oldMember, newMember) => {
 *   handleGuildMemberUpdate(oldMember, newMember);
 * });
 */
export async function handleGuildMemberUpdate(
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
  // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
  const ranks = getApexRanksForGuild(newMember.guild.id, newMember.guild);
  const resolver = buildRankResolver(ranks);
  const platforms = getApexPlatformsForGuild(
    newMember.guild.id,
    newMember.guild
  );
  const apexRoleNames = new Set(ranks.map((rank) => rank.roleName));
  const platformRoleNames = new Set(
    platforms.map((platform) => platform.roleName)
  );
  const allApexRoleNames = new Set([
    ...apexRoleNames,
    ...platformRoleNames,
  ]);

  const oldApexRoles = oldRoles.filter((role: any) =>
    allApexRoleNames.has(role.name)
  );
  const newApexRoles = newRoles.filter((role: any) =>
    allApexRoleNames.has(role.name)
  );

  // Si no hay cambios en roles de Apex (rank o plataforma), no hacer nada
  if (oldApexRoles.equals(newApexRoles)) return;

  logApp(
    `GuildMemberUpdate: ${newMember.user.tag} (${newMember.id}) cambió roles de Apex (rank/plataforma) en guild ${newMember.guild.name} (${newMember.guild.id})`
  );

  // Paso 4: Determinación del tipo de cambio - Analizar si cambió rango, plataforma o ambos
  const oldRankRoles = oldRoles.filter((role: any) =>
    apexRoleNames.has(role.name)
  );
  const newRankRoles = newRoles.filter((role: any) =>
    apexRoleNames.has(role.name)
  );

  const oldPlatformRoles = oldRoles.filter((role: any) =>
    platformRoleNames.has(role.name)
  );
  const newPlatformRoles = newRoles.filter((role: any) =>
    platformRoleNames.has(role.name)
  );

  // Paso 5: Actualización de datos del jugador - Procesar cambios en rango y/o plataforma
  const rankChanged = !oldRankRoles.equals(newRankRoles);
  const platformChanged = !oldPlatformRoles.equals(newPlatformRoles);

  if (rankChanged || platformChanged) {
    // Si cambió el rank, actualizar fecha y rank
    if (rankChanged) {
      let newRank: string | undefined;
      if (newRankRoles.size > 0) {
        const highestRank = resolver.pickHighest(newRankRoles.values());
        newRank = highestRank?.shortId;
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
        // 👇 USAR ROLES MAPEADOS DEL SERVIDOR
        const platformInfo = platforms.find(
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

  // Paso 6: Refresco coalescido de solo los cards de los rangos old/new
  const affectedRanks = new Set<string>();
  const oldHighestRank = resolver.pickHighest(oldRankRoles.values());
  const newHighestRank = resolver.pickHighest(newRankRoles.values());
  if (oldHighestRank) affectedRanks.add(oldHighestRank.shortId);
  if (newHighestRank) affectedRanks.add(newHighestRank.shortId);

  if (affectedRanks.size > 0) {
    requestRankCardRefresh(newMember.guild, affectedRanks, 3);
  }
}
