import type { AmbiguousRankRoles, GuildRankInspection } from './rank-catalog';
import type {
  RankRoleCandidateMatch,
  RankRoleDetectionResult,
  RankRoleProvisionResult,
} from './rank-roles';
import type {
  RankSyncReport,
  RankSyncRoleCandidate,
} from './rank-notify-types';

/**
 * Crea un reporte vacío para una ejecución del rank sync.
 *
 * @param reason - Motivo que originó la sincronización.
 * @returns El reporte listo para completarse durante el sync.
 */
export function createRankSyncReport(reason: string): RankSyncReport {
  return {
    reason,
    createdRoles: [],
    missingRoles: [],
    roleCandidates: [],
    panelUpdated: false,
    cardCount: 0,
    warnings: [],
    errors: [],
  };
}

/**
 * Convierte los candidatos detectados al formato del reporte.
 *
 * @param candidates - Candidatos detectados por `rank-roles`.
 * @returns Los candidatos listos para el reporte.
 */
function toReportCandidates(
  candidates: readonly RankRoleCandidateMatch[]
): RankSyncRoleCandidate[] {
  return candidates.map(({ rank, candidate }) => ({
    rankLabel: rank.label,
    roleName: candidate.roleName,
  }));
}

/**
 * Construye el aviso accionable para un rango con roles ambiguos.
 *
 * @param ambiguity - Rango y roles que resuelven al mismo shortId.
 * @returns El aviso para el reporte.
 */
function buildAmbiguousRankWarning(
  ambiguity: AmbiguousRankRoles
): string {
  const legacyRoleNames = ambiguity.roleNames.filter(
    (roleName) => roleName !== ambiguity.rank.roleName
  );

  return (
    `Rango ${ambiguity.rank.label}: roles ambiguos ` +
    `(${ambiguity.roleNames.join(', ')}). El panel usa ` +
    `"${ambiguity.rank.roleName}". Renombrá o unificá el rol legacy ` +
    `(${legacyRoleNames.join(', ')}) con ese nombre para conservar ID y ` +
    'miembros; no crees un rol nuevo.'
  );
}

/**
 * Construye los avisos accionables de todos los rangos ambiguos.
 *
 * @param ambiguities - Rangos con más de un rol que resuelve al mismo shortId.
 * @returns Los avisos listos para el reporte.
 */
export function collectAmbiguityWarnings(
  ambiguities: readonly AmbiguousRankRoles[]
): string[] {
  return ambiguities.map(buildAmbiguousRankWarning);
}

/**
 * Construye el error reportado cuando falló el sync previo de jugadores.
 *
 * @param detail - Detalle técnico del fallo de jugadores.
 * @returns El mensaje accionable para el reporte.
 */
export function buildPlayerSyncErrorMessage(detail: string): string {
  return (
    'No se reconstruyó el panel porque falló la sincronización de ' +
    `jugadores; el panel anterior quedó intacto. Detalle: ${detail}`
  );
}

/**
 * Completa el reporte con la detección de candidatos sin crear roles.
 *
 * @param report - Reporte en construcción.
 * @param detection - Candidatos detectados y rangos que podrían crearse.
 */
export function applyCandidateDetection(
  report: RankSyncReport,
  detection: RankRoleDetectionResult
): void {
  report.roleCandidates = toReportCandidates(detection.candidates);
  report.missingRoles = detection.ranksToCreate.map((rank) => rank.label);
}

/**
 * Completa el reporte con el resultado de provisionar los roles faltantes.
 *
 * Registra los roles creados y, si hubo fallos, los rangos que siguen
 * faltando junto con su error técnico.
 *
 * @param report - Reporte en construcción.
 * @param provision - Resultado de la provisión de roles.
 */
export function applyProvisionResult(
  report: RankSyncReport,
  provision: RankRoleProvisionResult
): void {
  report.createdRoles = provision.created.map((role) => role.name);

  if (provision.failed.length === 0) return;

  report.roleCandidates = toReportCandidates(provision.candidates);
  report.missingRoles = provision.failed.map(
    (failure) => failure.rank.label
  );
  report.errors.push(
    ...provision.failed.map(
      (failure) => `${failure.rank.label}: ${failure.error}`
    )
  );
}

/**
 * Completa el reporte con los rangos que siguen faltando tras la provisión.
 *
 * Cruza los rangos faltantes con los candidatos detectados para no reportar
 * como candidato un rol que ya se creó ni como faltante un rango que tiene
 * candidato.
 *
 * @param report - Reporte en construcción.
 * @param provision - Resultado de la provisión de roles.
 * @param refreshed - Inspección actualizada después de crear los roles.
 * @returns `true` si quedan candidatos o rangos faltantes por resolver.
 */
export function applyProvisionOutcome(
  report: RankSyncReport,
  provision: RankRoleProvisionResult,
  refreshed: GuildRankInspection
): boolean {
  const stillMissingIds = new Set(
    refreshed.missingRoles.map((rank) => rank.shortId)
  );
  report.roleCandidates = toReportCandidates(
    provision.candidates.filter(({ rank }) =>
      stillMissingIds.has(rank.shortId)
    )
  );

  const candidateRankIds = new Set(
    provision.candidates.map(({ rank }) => rank.shortId)
  );
  report.missingRoles = refreshed.missingRoles
    .filter((rank) => !candidateRankIds.has(rank.shortId))
    .map((rank) => rank.label);

  return report.roleCandidates.length > 0 || report.missingRoles.length > 0;
}
