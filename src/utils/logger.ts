import { appendFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Obtiene la raíz del proyecto (ajusta si usas otra estructura)
const ROOT_PATH = join(__dirname, '../../');
const LOG_DIR = join(ROOT_PATH, 'logs');
const LOG_PATH = join(LOG_DIR, 'canvas.log');
const INTERACTION_LOG_PATH = join(LOG_DIR, 'interactions.log');
const APP_LOG_PATH = join(LOG_DIR, 'app.log');

/**
 * Guarda un mensaje de log relacionado con Canvas en el archivo logs/canvas.log.
 * - Agrega marca de tiempo ISO al mensaje.
 * - Crea la carpeta logs si no existe.
 * - El mensaje también puede mostrarse por consola (descomentar línea).
 * @param message - Mensaje a registrar en el log.
 * @param args - Argumentos adicionales opcionales, el último puede ser el tiempo de ejecución en ms.
 * @returns Una promesa que se resuelve cuando el log se ha escrito.
 * @throws {Error} Si hay problemas de escritura en el archivo de log (silenciado internamente).
 */
export async function logCanvas(
  message: string,
  ...args: any[]
): Promise<void> {
  const timestamp = new Date().toISOString();
  let executionTimeMs: number | undefined;

  if (args.length > 0 && typeof args[args.length - 1] === 'number') {
    executionTimeMs = args.pop();
  }

  const timeInfo =
    executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
  const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
  const line = `[${timestamp}] [Canvas]${timeInfo} ${message}${formattedArgs}\n`;
  // Asegura que la carpeta exista
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  // Guarda en archivo
  await appendFile(LOG_PATH, line).catch(() => {});
  // Muestra en consola (descomenta si lo quieres ver en consola)
  // console.log(message);
}

/**
 * Guarda información detallada de una interacción en logs/interactions.log.
 * - Incluye marca de tiempo, tipo, usuario, guild, detalles relevantes.
 * - Crea la carpeta logs si no existe.
 * @param info - Objeto con datos de la interacción.
 * @param info.type - Tipo de interacción (ej. 'command', 'button').
 * @param info.userTag - Tag del usuario (ej. 'usuario#1234').
 * @param info.userId - ID del usuario.
 * @param info.guildName - Nombre del guild (opcional).
 * @param info.guildId - ID del guild (opcional).
 * @param info.commandName - Nombre del comando (opcional).
 * @param info.customId - ID personalizado (opcional).
 * @param info.details - Detalles adicionales (opcional).
 * @param info.executionTimeMs - Tiempo de ejecución en ms (opcional).
 * @returns Una promesa que se resuelve cuando el log se ha escrito.
 * @throws {Error} Si hay problemas de escritura en el archivo de log (silenciado internamente).
 */
export async function logInteraction(info: {
  type: string;
  userTag: string;
  userId: string;
  guildName?: string;
  guildId?: string;
  commandName?: string;
  customId?: string;
  details?: string;
  executionTimeMs?: number;
}) {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const timeInfo =
    info.executionTimeMs !== undefined ? ` [${info.executionTimeMs}ms]` : '';
  const line =
    [
      `[${timestamp}] [Interaction]${timeInfo}`,
      `Tipo: ${info.type}`,
      `Usuario: ${info.userTag} (${info.userId})`,
      info.guildName ? `Guild: ${info.guildName} (${info.guildId})` : '',
      info.commandName ? `Comando: ${info.commandName}` : '',
      info.customId ? `CustomId: ${info.customId}` : '',
      info.details ? `Detalles: ${info.details}` : '',
    ]
      .filter(Boolean)
      .join(' | ') + '\n';
  await appendFile(INTERACTION_LOG_PATH, line).catch(() => {});
}

/**
 * Guarda un mensaje de log general de la aplicación en logs/app.log.
 * - Agrega marca de tiempo ISO al mensaje.
 * - Crea la carpeta logs si no existe.
 * @param message - Mensaje a registrar en el log.
 * @param args - Argumentos adicionales opcionales, el último puede ser el tiempo de ejecución en ms.
 * @returns Una promesa que se resuelve cuando el log se ha escrito.
 * @throws {Error} Si hay problemas de escritura en el archivo de log (silenciado internamente).
 */
export async function logApp(message: string, ...args: any[]): Promise<void> {
  let executionTimeMs: number | undefined;

  if (args.length > 0 && typeof args[args.length - 1] === 'number') {
    executionTimeMs = args.pop();
  }

  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const timeInfo =
    executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
  const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
  const line = `[${timestamp}] [App]${timeInfo} ${message}${formattedArgs}\n`;
  await appendFile(APP_LOG_PATH, line).catch(() => {});
}
