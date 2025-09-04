import { Guild } from 'discord.js';

type UpdateFn = (guild: Guild) => Promise<void>;

/**
 * Crea un throttler para limitar la frecuencia de ejecución de una función de actualización.
 * - Ejecuta la función inmediatamente si ha pasado suficiente tiempo desde la última ejecución.
 * - Si no, programa la ejecución para después del tiempo restante.
 * - Solo ejecuta la última actualización solicitada en el intervalo.
 * @param waitMs Tiempo mínimo (ms) entre ejecuciones.
 * @param updateFn Función asíncrona que realiza la actualización.
 * @returns { requestUpdate, flush, cancel }
 */
export function createUpdateThrottler(waitMs: number, updateFn: UpdateFn) {
  let lastRun = 0;
  let timer: NodeJS.Timeout | null = null;
  let pending = false;
  let pendingGuild: Guild | null = null;

  const run = async (guild: Guild) => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pending = false;
    pendingGuild = null;
    lastRun = Date.now();
    try {
      await updateFn(guild);
    } catch (e) {
      console.error('[UpdateThrottler] Error en updateFn:', e);
    }
  };

  const requestUpdate = (guild: Guild) => {
    pendingGuild = guild;
    const now = Date.now();
    const since = now - lastRun;

    if (since >= waitMs) {
      void run(guild);
      return;
    }

    if (!pending) {
      pending = true;
      const delay = waitMs - since;
      timer = setTimeout(() => {
        if (pendingGuild) void run(pendingGuild);
      }, delay);
    }
  };

  const flush = async () => {
    if (pendingGuild) await run(pendingGuild);
  };

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = false;
    pendingGuild = null;
  };

  return { requestUpdate, flush, cancel };
}
