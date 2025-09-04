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
 * @param message Mensaje a registrar en el log.
 */
export async function logCanvas(message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [Canvas] ${message}\n`;
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
 * @param info Objeto con datos de la interacción.
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
}) {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const line = [
    `[${timestamp}] [Interaction]`,
    `Tipo: ${info.type}`,
    `Usuario: ${info.userTag} (${info.userId})`,
    info.guildName ? `Guild: ${info.guildName} (${info.guildId})` : '',
    info.commandName ? `Comando: ${info.commandName}` : '',
    info.customId ? `CustomId: ${info.customId}` : '',
    info.details ? `Detalles: ${info.details}` : ''
  ].filter(Boolean).join(' | ') + '\n';
  await appendFile(INTERACTION_LOG_PATH, line).catch(() => {});
}

/**
 * Guarda un mensaje de log general de la aplicación en logs/app.log.
 * - Agrega marca de tiempo ISO al mensaje.
 * - Crea la carpeta logs si no existe.
 * @param message Mensaje a registrar en el log.
 */
export async function logApp(message: string) {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [App] ${message}\n`;
  await appendFile(APP_LOG_PATH, line).catch(() => {});
}
