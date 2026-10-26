import {
  ColorResolvable,
  Guild,
  PermissionsBitField,
  Role,
  RoleCreateOptions,
} from 'discord.js';
import { ApexRank } from '../../interfaces/apex-rank';
import { normalizeRoleName } from './rank-catalog';
import { suppressRankRoleEvent } from './rank-event-state';
import { detectRankRoleCandidates } from './rank-role-detection';
import { applyRankRoleOrder } from './rank-role-order';
import type {
  RankRoleFailure,
  RankRoleProvisionResult,
} from './rank-roles-types';

export type {
  RankRoleCandidateMatch,
  RankRoleDetectionResult,
  RankRoleFailure,
  RankRoleProvisionResult,
} from './rank-roles-types';
export { detectRankRoleCandidates };

const ROLE_CREATE_DELAY_MS = 150;

/**
 * Crea los roles de rango que falten, sin tocar roles existentes.
 *
 * Antes de crear, busca un rol existente que pueda corresponder al rango por
 * nombre exacto, alias o similitud. Si lo encuentra, no crea nada y lo
 * devuelve en `candidates` para que el flujo lo reporte y el admin lo resuelva
 * con `/setup-roles`. Solo crea los rangos sin candidato, de forma secuencial.
 * Al finalizar, ordena todos los roles de rango en una sola llamada según el
 * catálogo y debajo del rol más alto del bot.
 *
 * @param guild - Guild donde se provisionan los roles.
 * @param missingRanks - Rangos detectados como faltantes.
 * @param catalogRanks - Catálogo inspeccionado para excluir roles de otros rangos.
 * @returns Roles creados, fallos y candidatos detectados.
 */
export async function ensureRankRoles(
  guild: Guild,
  missingRanks: ApexRank[],
  catalogRanks: readonly ApexRank[]
): Promise<RankRoleProvisionResult> {
  if (missingRanks.length === 0) {
    return { created: [], failed: [], candidates: [] };
  }

  const existingRoleNames = guild.roles.cache.map((role) => role.name);
  const { candidates, ranksToCreate } = detectRankRoleCandidates(
    existingRoleNames,
    missingRanks,
    catalogRanks
  );

  if (ranksToCreate.length === 0) {
    return { created: [], failed: [], candidates };
  }

  const botMember =
    guild.members.me ??
    (await guild.members.fetch(guild.client.user!.id).catch(() => null));

  if (!botMember) {
    return {
      created: [],
      failed: ranksToCreate.map((rank) => ({
        rank,
        error: 'No se pudo obtener el miembro del bot en el guild.',
      })),
      candidates,
    };
  }

  const canManageRoles = botMember.permissions.has(
    PermissionsBitField.Flags.ManageRoles
  );

  if (!canManageRoles) {
    return {
      created: [],
      failed: ranksToCreate.map((rank) => ({
        rank,
        error: 'El bot no tiene el permiso Gestionar roles.',
      })),
      candidates,
    };
  }

  const created: Role[] = [];
  const failed: RankRoleFailure[] = [];

  for (const rank of ranksToCreate) {
    try {
      const alreadyExists = guild.roles.cache.some(
        (role) =>
          normalizeRoleName(role.name) === normalizeRoleName(rank.roleName)
      );
      if (alreadyExists) continue;

      const options: RoleCreateOptions = {
        name: rank.roleName,
        colors: { primaryColor: rank.color as ColorResolvable },
        mentionable: true,
        reason: 'Sincronización automática de rangos de Apex',
      };

      const role = await guild.roles.create(options);
      suppressRankRoleEvent(role.id);
      created.push(role);
      await new Promise((resolve) =>
        setTimeout(resolve, ROLE_CREATE_DELAY_MS)
      );
    } catch (error) {
      failed.push({
        rank,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (created.length > 0) {
    await applyRankRoleOrder(
      guild,
      catalogRanks,
      botMember.roles.highest.id
    );
  }

  return { created, failed, candidates };
}
