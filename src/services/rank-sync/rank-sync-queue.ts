import { Guild } from 'discord.js';
import { logApp } from '../../utils/logger';

// #region Tipos

/**
 * Opciones de una sincronización de rangos.
 */
export interface RankSyncOptions {
  /** Motivo del encolado; se incluye en el reporte. */
  reason: string;
  /**
   * Si es `false`, no crea roles faltantes y solo reporta candidatos.
   * Si se omite o es `true`, el sync puede crearlos.
   */
  createMissingRoles?: boolean;
  /**
   * Error de la sincronización de jugadores previa al rank sync.
   * Si está presente, el panel no se reconstruye y el error se reporta.
   */
  playerSyncError?: string;
}

/**
 * Ejecuta una sincronización de rangos para una guild.
 */
export type RankSyncHandler = (
  guild: Guild,
  options: RankSyncOptions
) => Promise<void>;

/**
 * Elemento de la cola serial de sincronizaciones.
 */
interface QueuedRankSync {
  /** Guild a sincronizar. */
  guild: Guild;
  /** Opciones con las que se encoló la ejecución. */
  options: RankSyncOptions;
}

/**
 * Cola serial de sincronizaciones por guild.
 *
 * Mantiene locks por guild, una ejecución pendiente por guild y una demora
 * mínima entre ejecuciones para no saturar la VM.
 */
export interface RankSyncQueue {
  /**
   * Encola una sincronización y dispara el procesamiento.
   *
   * @param guild - Guild a sincronizar.
   * @param options - Opciones de la ejecución.
   */
  enqueue(guild: Guild, options: RankSyncOptions): void;
  /**
   * Marca la guild como en ejecución.
   *
   * Si ya hay una ejecución en curso, guarda las opciones para reencolarlas
   * cuando la ejecución actual termine.
   *
   * @param guild - Guild a sincronizar.
   * @param options - Opciones de la ejecución.
   * @returns `true` si la guild puede ejecutarse ahora.
   */
  begin(guild: Guild, options: RankSyncOptions): boolean;
  /**
   * Libera el lock de la guild y reencola la ejecución pendiente si existe.
   *
   * @param guild - Guild cuya ejecución terminó.
   */
  finish(guild: Guild): void;
  /**
   * Libera el estado en memoria de una guild eliminada.
   *
   * No interrumpe una ejecución en curso; su `finish` limpia el lock.
   *
   * @param guildId - ID de la guild que se removió.
   */
  forget(guildId: string): void;
}

// #endregion

// #region Cola

/** Pausa mínima entre ejecuciones para no saturar la VM. */
const QUEUE_DELAY_MS = 500;

/**
 * Espera asíncrona usada para espaciar las ejecuciones de la cola.
 *
 * @param ms - Milisegundos a esperar.
 * @returns Una promesa que se resuelve al vencer el plazo.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Crea la cola serial del rank sync.
 *
 * La cola recibe el handler para no depender de `rank-sync.ts` y evitar un
 * ciclo de imports. Los errores de una guild se registran sin detener el resto
 * de la cola.
 *
 * @param handler - Sincronización que ejecuta cada elemento de la cola.
 * @returns La cola lista para encolar guilds.
 */
export function createRankSyncQueue(
  handler: RankSyncHandler
): RankSyncQueue {
  const queue: QueuedRankSync[] = [];
  const running = new Set<string>();
  const pending = new Map<string, RankSyncOptions>();

  let processingQueue = false;
  let lastGuildRunAt = 0;

  /**
   * Procesa la cola serial de sincronizaciones.
   *
   * Evita ejecuciones concurrentes y respeta la pausa mínima entre guilds.
   */
  async function processQueue(): Promise<void> {
    if (processingQueue) return;
    processingQueue = true;

    try {
      while (queue.length > 0) {
        const next = queue.shift()!;
        const wait = Math.max(
          0,
          QUEUE_DELAY_MS - (Date.now() - lastGuildRunAt)
        );
        if (wait > 0) await sleep(wait);

        lastGuildRunAt = Date.now();
        try {
          await handler(next.guild, next.options);
        } catch (error) {
          logApp(
            `[rank-sync] Error no controlado en guild ${next.guild.name} ` +
              `(${next.guild.id}): ${error}`
          );
        }
      }
    } finally {
      processingQueue = false;
    }
  }

  /**
   * Encola una sincronización y dispara el procesamiento.
   *
   * @param guild - Guild a sincronizar.
   * @param options - Opciones de la ejecución.
   */
  function enqueue(guild: Guild, options: RankSyncOptions): void {
    queue.push({ guild, options });
    void processQueue();
  }

  /**
   * Marca la guild como en ejecución o guarda las opciones pendientes.
   *
   * @param guild - Guild a sincronizar.
   * @param options - Opciones de la ejecución.
   * @returns `true` si la guild puede ejecutarse ahora.
   */
  function begin(guild: Guild, options: RankSyncOptions): boolean {
    if (running.has(guild.id)) {
      pending.set(guild.id, options);
      return false;
    }

    running.add(guild.id);
    return true;
  }

  /**
   * Libera el lock de la guild y reencola la ejecución pendiente.
   *
   * @param guild - Guild cuya ejecución terminó.
   */
  function finish(guild: Guild): void {
    running.delete(guild.id);

    const next = pending.get(guild.id);
    if (next) {
      pending.delete(guild.id);
      enqueue(guild, next);
    }
  }

  /**
   * Libera el estado en memoria de una guild eliminada.
   *
   * @param guildId - ID de la guild que se removió.
   */
  function forget(guildId: string): void {
    pending.delete(guildId);
    for (let index = queue.length - 1; index >= 0; index--) {
      if (queue[index].guild.id === guildId) {
        queue.splice(index, 1);
      }
    }
  }

  return { enqueue, begin, finish, forget };
}

// #endregion
