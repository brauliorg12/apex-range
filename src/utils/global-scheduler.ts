import { Client, Guild } from 'discord.js';
import { updateRoleCountMessage } from './update-status-message';
import { updateBotPresence } from './presence-helper';
import { updateInitRoleSelectionImage } from '../helpers/update-role-selection-image';
import { logApp } from './logger';
import { updateApexInfoMessage } from '../helpers/update-apex-info-message';
import { synchronizePlayersWithRoles } from './synchronize-players';

type ScheduledTask = {
  guildId: string;
  intervalMs: number;
  lastRun: number;
  task: (guild: Guild, client: Client) => Promise<void>;
  name: string;
};

/**
 * Clase que maneja la programación de tareas periódicas para múltiples guilds.
 */
class GlobalScheduler {
  private client: Client;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private checkInterval = 5000; // Revisar cada 5 segundos
  public individualTimers: Map<string, NodeJS.Timeout> = new Map(); // Para timers individuales

  constructor(client: Client) {
    this.client = client;
    this.start();
  }

  /**
   * Registra una tarea periódica para un guild.
   * @param guildId - El ID del guild.
   * @param name - El nombre único de la tarea.
   * @param intervalMs - El intervalo en milisegundos (mínimo 5000ms recomendado).
   * @param task - La función a ejecutar. Recibe el guild y client como parámetros.
   * @throws {Error} Si el guildId o name están vacíos.
   */
  registerGuildTask(
    guildId: string,
    name: string,
    intervalMs: number,
    task: (guild: Guild, client: Client) => Promise<void>
  ): void {
    const key = `${guildId}:${name}`;
    this.scheduledTasks.set(key, {
      guildId,
      intervalMs,
      lastRun: 0,
      task,
      name,
    });
  }

  /**
   * Remueve todas las tareas de un guild.
   * @param guildId - El ID del guild a remover.
   */
  unregisterGuild(guildId: string): void {
    for (const [key, task] of this.scheduledTasks) {
      if (task.guildId === guildId) {
        this.scheduledTasks.delete(key);
      }
    }
  }

  /**
   * Inicia el scheduler global.
   * @private
   */
  private start(): void {
    this.timer = setInterval(() => {
      this.checkAndExecuteTasks();
    }, this.checkInterval);
  }

  /**
   * Detiene el scheduler.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Revisa y ejecuta tareas que han expirado su intervalo.
   * @private
   * @returns Una promesa que se resuelve cuando todas las tareas han sido verificadas.
   */
  private async checkAndExecuteTasks(): Promise<void> {
    const now = Date.now();

    for (const [key, task] of this.scheduledTasks) {
      if (now - task.lastRun >= task.intervalMs) {
        try {
          const guild = await this.client.guilds
            .fetch(task.guildId)
            .catch(() => null);
          if (guild) {
            task.lastRun = now;
            // Ejecutar directamente las tareas programadas sin cola para evitar delays
            await task.task(guild, this.client);
            // Agregar delay aleatorio pequeño (0-2 segundos) para evitar sobrecargar la API con requests simultáneas de múltiples guilds
            await new Promise((resolve) =>
              setTimeout(resolve, Math.random() * 2000)
            );
          } else {
            // Guild no encontrado, remover tarea
            this.scheduledTasks.delete(key);
          }
        } catch (error) {
          logApp(`Error ejecutando tarea programada ${key}: ${error}`);
        }
      }
    }
  }

  /**
   * Obtiene estadísticas del scheduler.
   * @returns Un objeto con el número total de tareas y guilds activos.
   */
  getStats(): { totalTasks: number; activeGuilds: number } {
    const guildIds = new Set(
      Array.from(this.scheduledTasks.values()).map((t) => t.guildId)
    );
    return {
      totalTasks: this.scheduledTasks.size,
      activeGuilds: guildIds.size,
    };
  }
}

// Instancia global
let globalScheduler: GlobalScheduler | null = null;

/**
 * Inicializa el scheduler global si no existe.
 * @param client - El cliente de Discord para el scheduler.
 */
export function initializeGlobalScheduler(client: Client): void {
  if (!globalScheduler) {
    globalScheduler = new GlobalScheduler(client);
  }
}

/**
 * Obtiene la instancia global del scheduler.
 * @returns La instancia del GlobalScheduler o null si no está inicializado.
 */
export function getGlobalScheduler(): GlobalScheduler | null {
  return globalScheduler;
}

/**
 * Registra tareas periódicas para un guild específico.
 * @param guild - El guild de Discord para el que se registran las tareas.
 * @param client - El cliente de Discord.
 */
export function registerGuildPeriodicTasks(guild: Guild, client: Client): void {
  if (!globalScheduler) return;

  const guildId = guild.id;

  // Actualización de Apex Info cada 5 minutos
  globalScheduler.registerGuildTask(
    guildId,
    'apex-info',
    5 * 60 * 1000, // 5 minutos
    async (guild, client) => {
      await updateApexInfoMessage(guild);
      logApp(
        `Actualización periódica de mensaje Apex Info en guild ${guild.name} (${guild.id})`
      );
    }
  );

  // Actualización de roles y presencia cada 2 minutos (más frecuente que antes)
  globalScheduler.registerGuildTask(
    guildId,
    'roles-presence',
    2 * 60 * 1000, // 2 minutos
    async (guild, client) => {
      await synchronizePlayersWithRoles(guild); // Sincronizar jugadores con roles PRIMERO
      await updateRoleCountMessage(guild);
      await updateBotPresence(client);
      logApp(
        `Actualización periódica de roles y presencia en guild ${guild.name} (${guild.id})`
      );
    }
  );

  // Actualización de imagen de selección cada 10 minutos
  globalScheduler.registerGuildTask(
    guildId,
    'role-selection-image',
    10 * 60 * 1000, // 10 minutos
    async (guild, client) => {
      await updateInitRoleSelectionImage(guild.id, client);
      logApp(
        `Actualización automática de imagen de selección de rango en guild ${guild.name} (${guild.id})`
      );
    }
  );
}

/**
 * Remueve todas las tareas programadas para un guild específico.
 * @param guildId - El ID del guild a remover del scheduler.
 */
export function unregisterGuildFromScheduler(guildId: string): void {
  if (globalScheduler) {
    globalScheduler.unregisterGuild(guildId);
  }
}

/**
 * Crea un timer individual para una tarea específica en un guild.
 * Útil para tareas críticas que necesitan ejecución garantizada sin cola.
 * @param guild - El guild de Discord para el timer.
 * @param taskName - El nombre único de la tarea.
 * @param intervalMs - El intervalo en milisegundos para ejecutar la tarea.
 * @param task - La función a ejecutar periódicamente.
 */
export function createGuildTimer(
  guild: Guild,
  taskName: string,
  intervalMs: number,
  task: (guild: Guild) => Promise<void>
): void {
  const key = `${guild.id}:${taskName}`;
  if (globalScheduler?.individualTimers.has(key)) {
    logApp(
      `Timer ya existe para ${taskName} en guild ${guild.name} (${guild.id}), omitiendo creación duplicada.`
    );
    return;
  }

  logApp(
    `Creando timer individual para ${taskName} en guild ${guild.name} (${
      guild.id
    }) cada ${intervalMs / 1000}s`
  );
  const timer = setInterval(async () => {
    try {
      await task(guild);
      logApp(`${taskName} ejecutado en guild ${guild.name} (${guild.id})`);
    } catch (error) {
      logApp(`Error en ${taskName} para guild ${guild.id}: ${error}`);
    }
  }, intervalMs);

  globalScheduler?.individualTimers.set(key, timer);
}
