import { Guild, Role } from 'discord.js';
import type { ApexRank } from '../../interfaces/apex-rank';
import type { RolesState } from '../../interfaces/bot-state';
import { RANK_ALIASES } from '../../models/constants-roles';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';
import {
  getRankCatalogSignature,
  normalizeRoleName,
} from './rank-catalog-signature';
import type {
  AmbiguousRankRoles,
  GuildRankInspection,
} from './rank-catalog-types';

/**
 * Obtiene todos los roles existentes que resuelven a un mismo rango.
 *
 * Considera el nombre resuelto, el label, el shortId y los alias conocidos.
 *
 * @param rank - Rango inspeccionado.
 * @param rolesByName - Índice de roles existentes por nombre normalizado.
 * @returns Nombres reales de los roles que resuelven al rango.
 */
function findMatchingRoleNames(
  rank: ApexRank,
  rolesByName: ReadonlyMap<string, Role>
): string[] {
  const candidateNames = new Set<string>([
    rank.roleName,
    rank.label,
    rank.shortId,
    ...(RANK_ALIASES[rank.shortId] ?? []),
  ]);
  const matches = new Set<string>();

  for (const candidateName of candidateNames) {
    const role = rolesByName.get(normalizeRoleName(candidateName));
    if (role) matches.add(role.name);
  }

  return [...matches];
}

/**
 * Inspecciona los rangos configurados contra los roles reales del guild
 * y el estado persistido del panel. No modifica nada.
 *
 * @param guild - Guild a inspeccionar.
 * @param state - Estado persistido del panel, o `null` si no existe.
 * @returns El estado del catálogo, roles y panel, con los motivos de sync.
 */
export function inspectGuildRanks(
  guild: Guild,
  state: RolesState | null
): GuildRankInspection {
  const ranks = getApexRanksForGuild(guild.id, guild);
  const rolesByName = new Map(
    guild.roles.cache.map((role) => [normalizeRoleName(role.name), role])
  );

  const signature = getRankCatalogSignature();
  const ambiguousRoles: AmbiguousRankRoles[] = [];
  const missingRoles: ApexRank[] = [];
  const missingCards: ApexRank[] = [];
  const currentKeys = new Set(ranks.map((rank) => rank.shortId));

  for (const rank of ranks) {
    const matchingRoleNames = findMatchingRoleNames(rank, rolesByName);
    if (matchingRoleNames.length > 1) {
      ambiguousRoles.push({ rank, roleNames: matchingRoleNames });
    }

    const role = rolesByName.get(normalizeRoleName(rank.roleName));
    const hasCard = Boolean(state?.rankCardMessageIds?.[rank.shortId]);

    if (!role) {
      missingRoles.push(rank);
    } else if (!hasCard) {
      missingCards.push(rank);
    }
  }

  const obsoleteCardKeys = Object.keys(state?.rankCardMessageIds ?? {}).filter(
    (key) => !currentKeys.has(key)
  );

  const reasons: string[] = [];
  if (state?.rankCatalogSignature !== signature) {
    reasons.push('catalog-changed');
  }
  if (missingRoles.length > 0) {
    reasons.push('missing-roles');
  }
  if (missingCards.length > 0) {
    reasons.push('missing-cards');
  }
  if (obsoleteCardKeys.length > 0) {
    reasons.push('obsolete-cards');
  }
  if (
    !state?.rankPanelHeaderMessageId ||
    !state?.rankPanelManagementMessageId
  ) {
    reasons.push('panel-ids-missing');
  }
  if (!state?.channelId) {
    reasons.push('missing-channel');
  }

  return {
    signature,
    ranks,
    missingRoles,
    missingCards,
    obsoleteCardKeys,
    ambiguousRoles,
    reasons,
    needsSync:
      Boolean(state?.channelId) &&
      reasons.some((reason) => reason !== 'missing-channel'),
  };
}
