/**
 * Tiempo durante el cual se ignora el evento de creación de un rol generado
 * por el sync.
 */
const SUPPRESSION_MS = 60_000;
const suppressedRoleIds = new Set<string>();
const timers = new Map<string, NodeJS.Timeout>();

/**
 * Marca un rol creado por el sync para que su evento de creación no genere
 * una nueva sincronización en cadena.
 *
 * No suprime los renombrados manuales ni los cambios de posición de ese rol.
 *
 * @param roleId - ID del rol creado por el sync.
 */
export function suppressRankRoleEvent(roleId: string): void {
  const existing = timers.get(roleId);
  if (existing) clearTimeout(existing);

  suppressedRoleIds.add(roleId);
  const timer = setTimeout(() => {
    suppressedRoleIds.delete(roleId);
    timers.delete(roleId);
  }, SUPPRESSION_MS);
  timer.unref();
  timers.set(roleId, timer);
}

/**
 * Indica si el evento de creación de un rol fue generado por el propio sync.
 *
 * Solo debe consultarse para eventos de creación. Los renombrados manuales no
 * se suprimen por ID de rol.
 *
 * @param roleId - ID del rol a consultar.
 * @returns `true` si el rol está dentro de la ventana de supresión.
 */
export function isRankRoleEventSuppressed(roleId: string): boolean {
  return suppressedRoleIds.has(roleId);
}
