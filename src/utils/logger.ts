import { appendFile } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Obtiene la raíz del proyecto (ajusta si usas otra estructura)
const ROOT_PATH = join(__dirname, '../../');
const LOG_DIR = join(ROOT_PATH, 'logs');
const LOG_PATH = join(LOG_DIR, 'canvas.log');

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
