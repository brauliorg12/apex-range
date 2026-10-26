/**
 * Barrel mínimo del panel de rangos.
 *
 * Mantiene los exports históricos de `rank-panel.ts` mientras la implementación
 * vive en módulos separados por responsabilidad.
 */
export type {
  RankPanelCard,
  RankPanelCollectionResult,
  RankPanelJournalState,
  RankPanelMessageIds,
  RankPanelPayload,
  RankPanelRebuildResult,
  RankPanelRecoveryResult,
} from './rank-panel-types';
export { buildRankPanel } from './rank-panel-builder';
export { sendRankPanelMessages } from './rank-panel-sender';
export { collectOldPanelMessageIds } from './rank-panel-cleanup';
export {
  hasPendingRankPanelRecovery,
  persistRankPanelState,
  recoverRankPanelState,
} from './rank-panel-journal';
export { rebuildRankPanel } from './rank-panel-rebuild';
