import { appendFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Obtiene la raíz del proyecto (ajusta si usas otra estructura)
const ROOT_PATH = join(__dirname, '../../');
const LOG_DIR = join(ROOT_PATH, 'logs');

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para nombrar archivos de log
 */
function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Obtiene la ruta del archivo de log para un tipo específico y fecha
 */
function getLogFilePath(logType: string, dateString?: string): string {
  const date = dateString || getCurrentDateString();
  const typeDir = join(LOG_DIR, logType);

  // Crear directorio si no existe
  if (!existsSync(typeDir)) {
    mkdirSync(typeDir, { recursive: true });
  }

  return join(typeDir, `${logType}-${date}.log`);
}

/**
 * Guarda un mensaje de log relacionado con Canvas en el archivo logs/canvas/YYYY-MM-DD/canvas-YYYY-MM-DD.log.
 * - Agrega marca de tiempo ISO al mensaje.
 * - Crea la carpeta logs/canvas si no existe.
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

  // Obtener ruta del archivo de log para canvas
  const logPath = getLogFilePath('canvas');

  // Guarda en archivo
  await appendFile(logPath, line).catch(() => {});
  // Muestra en consola (descomenta si lo quieres ver en consola)
  // console.log(message);
}

/**
 * Guarda información detallada de una interacción en logs/interactions/YYYY-MM-DD/interactions-YYYY-MM-DD.log.
 * - Incluye marca de tiempo, tipo, usuario, guild, detalles relevantes.
 * - Crea la carpeta logs/interactions si no existe.
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

  // Obtener ruta del archivo de log para interactions
  const logPath = getLogFilePath('interactions');

  await appendFile(logPath, line).catch(() => {});
}

/**
 * Guarda un mensaje de log general de la aplicación en logs/app/YYYY-MM-DD/app-YYYY-MM-DD.log.
 * - Agrega marca de tiempo ISO al mensaje.
 * - Crea la carpeta logs/app si no existe.
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

  const timestamp = new Date().toISOString();
  const timeInfo =
    executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
  const formattedArgs = args.length > 0 ? ` ${JSON.stringify(args)}` : '';
  const line = `[${timestamp}] [App]${timeInfo} ${message}${formattedArgs}\n`;

  // Obtener ruta del archivo de log para app
  const logPath = getLogFilePath('app');

  await appendFile(logPath, line).catch(() => {});
}
