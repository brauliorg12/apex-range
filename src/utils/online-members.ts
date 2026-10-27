import type { PlayerRecord } from '../interfaces/player';

export type {
  RankMemberIndex,
  RankMemberIndexOptions,
} from './rank-member-index';
export { buildRankMemberIndex } from './rank-member-index';

/**
 * Estados de presencia considerados al ordenar miembros.
 */
type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'invisible';

/**
 * Miembro mínimo necesario para ordenar por prioridad.
 */
interface PriorityMember {
  /** ID del miembro. */
  id: string;
  /** Presencia de Discord; `null` o ausente si no se conoce. */
  presence?: { status?: string } | null;
}

/**
 * Construye el mapa de fechas de asignación usado como fallback.
 *
 * Convierte cada fecha una sola vez fuera del comparador. Las fechas inválidas
 * conservan el comportamiento histórico de `NaN`.
 *
 * @param playerData - Registros con `userId` y `assignedAt`.
 * @returns El mapa de timestamps en milisegundos.
 */
function buildAssignedAtFallback(
  playerData: readonly PlayerRecord[]
): Map<string, number> {
  const assignedAt = new Map<string, number>();

  for (const player of playerData) {
    assignedAt.set(player.userId, new Date(player.assignedAt).getTime());
  }

  return assignedAt;
}

/**
 * Ordena los miembros por prioridad para mostrar en los paneles:
 * - Estado de presencia: primero online, luego inactivos (idle), luego dnd,
 *   luego offline/invisible.
 * - Si el estado es igual, prioriza por fecha de asignación del rango
 *   (más reciente primero).
 * - Los miembros sin datos de presencia quedan al final.
 *
 * @param members - Array de miembros del servidor.
 * @param playerData - Array de datos de jugadores con fecha de asignación.
 * @param assignedAtByUserId - Mapa de timestamps ya construido; si se omite,
 *   se arma un fallback desde `playerData`.
 * @returns Array de miembros ordenados por prioridad.
 */
export function sortMembersByPriority<T extends PriorityMember>(
  members: readonly T[],
  playerData: readonly PlayerRecord[],
  assignedAtByUserId?: ReadonlyMap<string, number>
): T[] {
  const assignedAt =
    assignedAtByUserId ?? buildAssignedAtFallback(playerData);

  const statusOrder: Record<PresenceStatus, number> = {
    online: 0,
    idle: 1,
    dnd: 2,
    offline: 3,
    invisible: 4,
  };

  return [...members].sort((a, b) => {
    if (!a.presence && b.presence) return 1;
    if (a.presence && !b.presence) return -1;
    if (!a.presence && !b.presence) return 0;

    const aStatus =
      statusOrder[(a.presence?.status ?? 'offline') as PresenceStatus];
    const bStatus =
      statusOrder[(b.presence?.status ?? 'offline') as PresenceStatus];
    if (aStatus !== bStatus) return aStatus - bStatus;

    const aAssigned = assignedAt.get(a.id) ?? 0;
    const bAssigned = assignedAt.get(b.id) ?? 0;
    return bAssigned - aAssigned;
  });
}
