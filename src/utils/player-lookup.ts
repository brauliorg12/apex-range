import type { PlayerRecord } from '../interfaces/player';

/**
 * Mapas precomputados de jugadores para un ciclo de render.
 *
 * Se construyen una sola vez por refresco para evitar búsquedas y lecturas por
 * cada miembro.
 */
export interface PlayerLookup {
  /** Plataforma por userId; si hay duplicados gana el primer registro. */
  platformByUserId: ReadonlyMap<string, string>;
  /** Timestamp de `assignedAt` por userId; si hay duplicados gana el último. */
  assignedAtByUserId: ReadonlyMap<string, number>;
  /** Ícono por `apiName` de plataforma; se omite si el flujo no tiene guild. */
  platformIconByApiName?: ReadonlyMap<string, string>;
}

/**
 * Construye el mapa de fechas de asignación por userId.
 *
 * Recorre una sola vez y conserva el último registro de cada usuario, igual
 * que el ordenamiento histórico. Las fechas inválidas conservan `NaN`, como el
 * `Date#getTime` anterior.
 *
 * @param players - Registros deserializados de `players_*.json`.
 * @returns El mapa de timestamps en milisegundos.
 */
export function buildAssignedAtByUserId(
  players: readonly PlayerRecord[]
): ReadonlyMap<string, number> {
  const assignedAtByUserId = new Map<string, number>();

  for (const player of players) {
    assignedAtByUserId.set(player.userId, Date.parse(player.assignedAt));
  }

  return assignedAtByUserId;
}

/**
 * Construye los mapas de plataforma y fecha de asignación de un ciclo.
 *
 * @param players - Registros deserializados de `players_*.json`.
 * @returns Los mapas listos para consultar durante el render.
 */
export function buildPlayerLookup(
  players: readonly PlayerRecord[]
): PlayerLookup {
  const platformByUserId = new Map<string, string>();

  for (const player of players) {
    if (!platformByUserId.has(player.userId)) {
      platformByUserId.set(player.userId, player.platform ?? '');
    }
  }

  return {
    platformByUserId,
    assignedAtByUserId: buildAssignedAtByUserId(players),
  };
}
