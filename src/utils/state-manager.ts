/**
 * Barrel mínimo del estado persistido.
 *
 * Mantiene los imports históricos de `state-manager.ts` mientras la
 * implementación vive en módulos separados por responsabilidad.
 */
export type {
  GuildStateFile,
  RolesStateReadResult,
} from './roles-state';
export {
  readRolesState,
  readRolesStateStrict,
  updateRolesState,
} from './roles-state';
export type { CachedPlayersSnapshot } from './players-cache';
export { invalidatePlayersCache } from './players-cache';
export type { PlayersReadResult } from './players-state';
export {
  mutatePlayers,
  readPlayers,
  readPlayersStrict,
} from './players-state';
export {
  readPlayersCached,
  readPlayersCachedStrict,
} from './players-snapshot';
export {
  readApexStatusState,
  readBotControlState,
  writeApexStatusState,
  writeBotControlState,
} from './apex-control-state';
