import * as fs from 'fs';
import * as path from 'path';
import { readdir, unlink } from 'fs/promises';

const LOGS_DIR = path.join(__dirname, '../../logs');
const GUILDS_DIR = path.join(LOGS_DIR, 'guilds');
const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5MB en bytes
const LOG_RETENTION_DAYS = 2; // Mantener logs de los últimos 2 días

// Crear directorio de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Crear directorio de guilds si no existe
if (!fs.existsSync(GUILDS_DIR)) {
  fs.mkdirSync(GUILDS_DIR, { recursive: true });
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Limpia directorios de logs antiguos (más de LOG_RETENTION_DAYS días)
 * Se ejecuta de forma asíncrona sin bloquear la aplicación
 */
async function cleanOldLogs(): Promise<void> {
  try {
    const now = Date.now();
    const maxAgeMs = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    // Limpiar logs de guilds (por carpeta de fecha)
    if (fs.existsSync(GUILDS_DIR)) {
      const dateDirs = await readdir(GUILDS_DIR);
      
      for (const dateDir of dateDirs) {
        const dateDirPath = path.join(GUILDS_DIR, dateDir);
        const stats = fs.statSync(dateDirPath);
        
        // Verificar si es un directorio
        if (stats.isDirectory()) {
          const dirAge = now - stats.mtimeMs;
          
          if (dirAge > maxAgeMs) {
            // Eliminar todos los archivos dentro del directorio
            const files = await readdir(dateDirPath);
            for (const file of files) {
              await unlink(path.join(dateDirPath, file));
            }
            // Eliminar el directorio vacío
            fs.rmdirSync(dateDirPath);
            console.log(`[ServerLogger] Directorio de logs eliminado: ${dateDir}`);
          }
        }
      }
    }
    
    // Limpiar logs globales
    const globalDir = path.join(LOGS_DIR, 'global');
    if (fs.existsSync(globalDir)) {
      const files = await readdir(globalDir);
      
      for (const file of files) {
        const filePath = path.join(globalDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;
        
        if (fileAge > maxAgeMs) {
          await unlink(filePath);
          console.log(`[ServerLogger] Archivo de log global eliminado: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('[ServerLogger] Error al limpiar logs antiguos:', error);
  }
}

/**
 * Logger específico para cada servidor de Discord
 */
export class ServerLogger {
  private guildId: string;
  private guildName: string;
  private currentDate: string;
  private currentLogFile: string;
  private currentPartNumber: number;

  constructor(guildId: string, guildName?: string) {
    this.guildId = guildId;
    this.guildName = guildName || 'unknown';
    this.currentDate = getCurrentDateString();
    this.currentLogFile = ''; // Se inicializará en updateLogFile
    this.currentPartNumber = 1;
    this.updateLogFile();
  }

  /**
   * Actualiza el archivo de log actual basado en la fecha y número de parte
   */
  private updateLogFile(): void {
    const safeName = this.guildName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateDir = path.join(GUILDS_DIR, this.currentDate);

    // Crear directorio de la fecha si no existe
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    // Buscar el último archivo de log existente para este guild hoy
    const baseFileName = `guild_${this.guildId}_${safeName}`;
    let partNumber = 1;
    let testFile = path.join(dateDir, `${baseFileName}_part${partNumber}.log`);

    // Buscar el último archivo de parte que existe
    while (fs.existsSync(testFile)) {
      const stats = fs.statSync(testFile);
      if (stats.size < MAX_LOG_SIZE_BYTES) {
        // Este archivo aún tiene espacio, usarlo
        this.currentPartNumber = partNumber;
        this.currentLogFile = testFile;
        return;
      }
      partNumber++;
      testFile = path.join(dateDir, `${baseFileName}_part${partNumber}.log`);
    }

    // Si llegamos aquí, necesitamos crear un nuevo archivo de parte
    this.currentPartNumber = partNumber;
    this.currentLogFile = testFile;
  }

  /**
   * Verifica si necesitamos cambiar de archivo de log (nuevo día o tamaño excedido)
   */
  private checkDateChange(): void {
    const today = getCurrentDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.currentPartNumber = 1;
      this.updateLogFile();
      return;
    }

    // Verificar si el archivo actual excede el tamaño máximo
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size >= MAX_LOG_SIZE_BYTES) {
        // El archivo actual es demasiado grande, crear uno nuevo
        this.currentPartNumber++;
        const safeName = this.guildName.replace(/[^a-zA-Z0-9]/g, '_');
        const dateDir = path.join(GUILDS_DIR, this.currentDate);
        const baseFileName = `guild_${this.guildId}_${safeName}`;
        this.currentLogFile = path.join(
          dateDir,
          `${baseFileName}_part${this.currentPartNumber}.log`
        );
      }
    }
  }

  private formatMessage(
    level: string,
    message: string,
    ...args: any[]
  ): string {
    const timestamp = new Date().toISOString();
    let executionTimeMs: number | undefined;
    let formattedArgs = '';

    if (args.length > 0 && typeof args[args.length - 1] === 'number') {
      executionTimeMs = args.pop();
    }

    if (args.length > 0) {
      formattedArgs = ` ${JSON.stringify(args)}`;
    }

    const timeInfo =
      executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
    return `[${timestamp}] [${level}] [Guild:${this.guildId}]${timeInfo} ${message}${formattedArgs}\n`;
  }

  private writeToFile(content: string): void {
    try {
      this.checkDateChange(); // Verificar cambio de fecha antes de escribir
      fs.appendFileSync(this.currentLogFile, content);
    } catch (error) {
      console.error(`Error writing to log file ${this.currentLogFile}:`, error);
    }
  }

  info(message: string, ...args: any[]): void {
    const logMessage = this.formatMessage('INFO', message, ...args);
    console.log(logMessage.trim());
    this.writeToFile(logMessage);
  }

  warn(message: string, ...args: any[]): void {
    const logMessage = this.formatMessage('WARN', message, ...args);
    console.warn(logMessage.trim());
    this.writeToFile(logMessage);
  }

  error(message: string, ...args: any[]): void {
    const logMessage = this.formatMessage('ERROR', message, ...args);
    console.error(logMessage.trim());
    this.writeToFile(logMessage);
  }

  debug(message: string, ...args: any[]): void {
    const logMessage = this.formatMessage('DEBUG', message, ...args);
    console.log(logMessage.trim());
    this.writeToFile(logMessage);
  }
}

// Cache de loggers para evitar crear múltiples instancias
const loggerCache = new Map<string, ServerLogger>();

/**
 * Obtiene o crea un logger para un servidor específico
 */
export function getServerLogger(
  guildId: string,
  guildName?: string
): ServerLogger {
  const cacheKey = `${guildId}_${guildName || 'unknown'}`;

  if (!loggerCache.has(cacheKey)) {
    loggerCache.set(cacheKey, new ServerLogger(guildId, guildName));
  }

  return loggerCache.get(cacheKey)!;
}

/**
 * Obtiene la ruta del archivo de log global con rotación por tamaño
 */
function getGlobalLogFilePath(): string {
  const globalDir = path.join(LOGS_DIR, 'global');
  if (!fs.existsSync(globalDir)) {
    fs.mkdirSync(globalDir, { recursive: true });
  }

  const dateStr = getCurrentDateString();
  const baseFileName = `global-${dateStr}`;
  let partNumber = 1;
  let testFile = path.join(globalDir, `${baseFileName}_part${partNumber}.log`);

  // Buscar el último archivo de parte que existe
  while (fs.existsSync(testFile)) {
    const stats = fs.statSync(testFile);
    if (stats.size < MAX_LOG_SIZE_BYTES) {
      // Este archivo aún tiene espacio, usarlo
      return testFile;
    }
    partNumber++;
    testFile = path.join(globalDir, `${baseFileName}_part${partNumber}.log`);
  }

  // Si llegamos aquí, necesitamos crear un nuevo archivo de parte
  return testFile;
}

/**
 * Logger global para mensajes que no son específicos de un servidor
 */
export const globalLogger = {
  info: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    let executionTimeMs: number | undefined;
    let formattedArgs = '';

    if (args.length > 0 && typeof args[args.length - 1] === 'number') {
      executionTimeMs = args.pop();
    }

    if (args.length > 0) {
      formattedArgs = ` ${JSON.stringify(args)}`;
    }

    const timeInfo =
      executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
    const logMessage = `[${timestamp}] [GLOBAL]${timeInfo} ${message}${formattedArgs}\n`;
    console.log(logMessage.trim());

    // Obtener archivo de log con rotación automática
    const globalLogFile = getGlobalLogFilePath();
    try {
      fs.appendFileSync(globalLogFile, logMessage);
    } catch (error) {
      console.error('Error writing to global log file:', error);
    }
  },

  error: (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    let executionTimeMs: number | undefined;
    let formattedArgs = '';

    if (args.length > 0 && typeof args[args.length - 1] === 'number') {
      executionTimeMs = args.pop();
    }

    if (args.length > 0) {
      formattedArgs = ` ${JSON.stringify(args)}`;
    }

    const timeInfo =
      executionTimeMs !== undefined ? ` [${executionTimeMs}ms]` : '';
    const logMessage = `[${timestamp}] [GLOBAL-ERROR]${timeInfo} ${message}${formattedArgs}\n`;
    console.error(logMessage.trim());

    // Obtener archivo de log con rotación automática
    const globalLogFile = getGlobalLogFilePath();
    try {
      fs.appendFileSync(globalLogFile, logMessage);
    } catch (error) {
      console.error('Error writing to global log file:', error);
    }
  },
};

// Ejecutar limpieza de logs antiguos cada 6 horas
setInterval(() => {
  cleanOldLogs().catch(() => {});
}, 6 * 60 * 60 * 1000);

// Ejecutar limpieza al iniciar la aplicación
cleanOldLogs().catch(() => {});
