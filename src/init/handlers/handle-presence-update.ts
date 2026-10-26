import { requestPresenceCardRefresh } from '../../helpers/rank-card-refresh-queue';

/**
 * Maneja cambios en la presencia de miembros en servidores configurados.
 *
 * Solo solicita el refresco coalescido del card del rango más alto del
 * miembro. La presencia global y las estadísticas quedan a cargo del scheduler.
 *
 * @param oldPresence - La presencia anterior.
 * @param newPresence - La nueva presencia.
 */
export async function handlePresenceUpdate(
  oldPresence: any,
  newPresence: any
): Promise<void> {
  if (!newPresence.guild || !newPresence.member) return;

  const oldStatus = oldPresence?.status;
  const newStatus = newPresence.status;
  if (oldStatus === newStatus) return;

  requestPresenceCardRefresh(newPresence.guild, newPresence.member.id, 1);
}
