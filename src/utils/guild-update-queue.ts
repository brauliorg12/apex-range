import { Guild } from 'discord.js';

/** Tarea de actualización encolada para un guild. */
type UpdateTask = {
  /** Guild al que pertenece la tarea. */
  guild: Guild;
  /** Trabajo a ejecutar. */
  task: () => Promise<void>;
  /** Prioridad: 0 = baja, 1 = normal, 2 = alta, 3 = muy alta. */
  priority: number;
  /** Momento de encolado, usado para ordenar tareas de igual prioridad. */
  timestamp: number;
  /** Clave estable para deduplicar tareas equivalentes. */
  key: string;
};

/**
 * Cola de actualizaciones por guild con concurrencia limitada.
 */
class GuildUpdateQueue {
  private queues: Map<string, UpdateTask[]> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrency = 1; // Prioriza estabilidad de CPU sobre paralelismo

  /**
   * Agrega una tarea a la cola del guild.
   *
   * Si ya existe una tarea con la misma clave, conserva la de mayor prioridad.
   * La clave debe ser estable entre llamadas equivalentes.
   *
   * @param guildId - El ID único del servidor de Discord.
   * @param task - Tarea a encolar.
   */
  enqueue(guildId: string, task: UpdateTask): void {
    let queue = this.queues.get(guildId);
    if (!queue) {
      queue = [];
      this.queues.set(guildId, queue);
    }

    const existingIndex = queue.findIndex(
      (queued) => queued.key === task.key
    );
    if (existingIndex !== -1) {
      if (queue[existingIndex].priority < task.priority) {
        queue[existingIndex] = task;
      }
      this.drain();
      return;
    }

    queue.push(task);
    this.drain();
  }

  /**
   * Inicia tantos guilds como permita la concurrencia máxima.
   */
  private drain(): void {
    if (this.processing.size >= this.maxConcurrency) return;

    for (const [guildId, queue] of this.queues) {
      if (this.processing.size >= this.maxConcurrency) break;
      if (queue.length === 0) {
        this.queues.delete(guildId);
        continue;
      }
      if (this.processing.has(guildId)) continue;

      void this.processQueue(guildId);
    }
  }

  /**
   * Procesa la cola del guild si no está siendo procesada.
   *
   * @param guildId - El ID único del servidor de Discord.
   */
  private async processQueue(guildId: string): Promise<void> {
    if (
      this.processing.has(guildId) ||
      this.processing.size >= this.maxConcurrency
    ) {
      return;
    }

    const queue = this.queues.get(guildId);
    if (!queue || queue.length === 0) {
      this.queues.delete(guildId);
      return;
    }

    this.processing.add(guildId);

    try {
      queue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });

      while (queue.length > 0 && this.processing.has(guildId)) {
        const task = queue.shift()!;
        try {
          await task.task();
        } catch (error) {
          console.error(
            `[GuildUpdateQueue] Error procesando tarea para guild ${guildId}:`,
            error
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } finally {
      this.processing.delete(guildId);
      if (queue.length === 0) {
        this.queues.delete(guildId);
      }
      setImmediate(() => this.drain());
    }
  }

  /**
   * Cancela todas las tareas pendientes de un guild.
   *
   * No interrumpe una tarea en curso; su `finally` libera el slot.
   *
   * @param guildId - El ID único del servidor de Discord.
   */
  cancelGuild(guildId: string): void {
    this.queues.delete(guildId);
    if (!this.processing.has(guildId)) {
      this.drain();
    }
  }

  /**
   * Obtiene estadísticas de la cola.
   *
   * @returns Cantidad de tareas pendientes por guild.
   */
  getStats(): { [guildId: string]: number } {
    const stats: { [guildId: string]: number } = {};
    for (const [guildId, queue] of this.queues) {
      stats[guildId] = queue.length;
    }
    return stats;
  }
}

// Instancia global
export const globalUpdateQueue = new GuildUpdateQueue();

/**
 * Función helper para encolar actualizaciones de roles y presencia.
 *
 * @param guild - Guild al que pertenece la actualización.
 * @param updateFn - Trabajo a ejecutar.
 * @param key - Clave estable de deduplicación dentro del guild.
 * @param priority - Prioridad de la tarea.
 */
export function enqueueGuildUpdate(
  guild: Guild,
  updateFn: () => Promise<void>,
  key: string,
  priority: number = 1
): void {
  globalUpdateQueue.enqueue(guild.id, {
    guild,
    task: updateFn,
    priority,
    timestamp: Date.now(),
    key,
  });
}
