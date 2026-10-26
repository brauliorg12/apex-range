import { Guild } from 'discord.js';

type UpdateTask = {
  guild: Guild;
  task: () => Promise<void>;
  priority: number; // 0 = low, 1 = normal, 2 = high
  timestamp: number;
};

class GuildUpdateQueue {
  private queues: Map<string, UpdateTask[]> = new Map();
  private processing: Set<string> = new Set();
  private maxConcurrency = 1; // Prioriza estabilidad de CPU sobre paralelismo

  /**
   * Agrega una tarea a la cola del guild.
   * Si ya existe una tarea similar, la reemplaza con la de mayor prioridad.
   */
  enqueue(guildId: string, task: UpdateTask): void {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, []);
    }

    const queue = this.queues.get(guildId)!;

    // Remover tareas duplicadas (mismo tipo de actualización)
    const existingIndex = queue.findIndex((t) => t.task === task.task);
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
   * Inicia tareas pendientes hasta llenar la concurrencia disponible.
   */
  private drain(): void {
    while (this.processing.size < this.maxConcurrency) {
      let nextGuildId: string | undefined;

      for (const [guildId, queue] of this.queues) {
        if (!this.processing.has(guildId) && queue.length > 0) {
          nextGuildId = guildId;
          break;
        }
      }

      if (!nextGuildId) return;
      void this.processQueue(nextGuildId);
    }
  }

  /**
   * Procesa la cola del guild si no está siendo procesada.
   */
  private async processQueue(guildId: string): Promise<void> {
    if (
      this.processing.has(guildId) ||
      this.processing.size >= this.maxConcurrency
    ) {
      return;
    }

    const queue = this.queues.get(guildId);
    if (!queue || queue.length === 0) return;

    this.processing.add(guildId);

    try {
      // Ordenar por prioridad (mayor primero) y timestamp (menor primero)
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

        // Pequeña pausa entre tareas para no sobrecargar
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } finally {
      this.processing.delete(guildId);

      if (queue.length === 0) {
        this.queues.delete(guildId);
      }

      this.drain();
    }
  }

  /**
   * Cancela todas las tareas pendientes de un guild.
   *
   * No interrumpe una tarea en curso; su `finally` libera el slot.
   */
  cancelGuild(guildId: string): void {
    this.queues.delete(guildId);
    if (!this.processing.has(guildId)) {
      this.drain();
    }
  }

  /**
   * Obtiene estadísticas de la cola.
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
 */
export function enqueueGuildUpdate(
  guild: Guild,
  updateFn: () => Promise<void>,
  priority: number = 1
): void {
  globalUpdateQueue.enqueue(guild.id, {
    guild,
    task: updateFn,
    priority,
    timestamp: Date.now(),
  });
}
