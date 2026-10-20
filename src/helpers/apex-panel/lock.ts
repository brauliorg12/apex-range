const updateLocks = new Map<string, Promise<void>>();

/**
 * Serializa cualquier operacion sobre el panel de Apex de un guild.
 * Se usa desde el scheduler y desde el comando `/apex-status` para evitar
 * que dos flujos creen paneles duplicados.
 *
 * @param guildId ID del guild.
 * @param operation Operacion a ejecutar de forma exclusiva.
 * @returns El resultado de la operacion.
 */
export function withApexPanelLock<T>(
  guildId: string,
  operation: () => Promise<T>
): Promise<T> {
  const previous = updateLocks.get(guildId) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  const cleanup = current.then(
    () => {},
    () => {}
  );

  updateLocks.set(guildId, cleanup);

  // Libera la entrada cuando termina la ultima operacion encolada.
  cleanup.finally(() => {
    if (updateLocks.get(guildId) === cleanup) {
      updateLocks.delete(guildId);
    }
  });

  return current;
}
