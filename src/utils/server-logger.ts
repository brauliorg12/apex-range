import * as fs from 'fs';
import * as path from 'path';

const LOGS_DIR = path.join(__dirname, '../../logs');
const GUILDS_DIR = path.join(LOGS_DIR, 'guilds');

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
 * Logger específico para cada servidor de Discord
 */
export class ServerLogger {
  private guildId: string;
  private guildName: string;
  private currentDate: string;
  private currentLogFile: string;

  constructor(guildId: string, guildName?: string) {
    this.guildId = guildId;
    this.guildName = guildName || 'unknown';
    this.currentDate = getCurrentDateString();
    this.currentLogFile = ''; // Se inicializará en updateLogFile
    this.updateLogFile();
  }

  /**
   * Actualiza el archivo de log actual basado en la fecha
   */
  private updateLogFile(): void {
    const safeName = this.guildName.replace(/[^a-zA-Z0-9]/g, '_');
    const dateDir = path.join(GUILDS_DIR, this.currentDate);

    // Crear directorio de la fecha si no existe
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    this.currentLogFile = path.join(
      dateDir,
      `guild_${this.guildId}_${safeName}.log`
    );
  }

  /**
   * Verifica si necesitamos cambiar de archivo de log (nuevo día)
   */
  private checkDateChange(): void {
    const today = getCurrentDateString();
    if (today !== this.currentDate) {
      this.currentDate = today;
      this.updateLogFile();
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

    // Crear directorio para global si no existe
    const globalDir = path.join(LOGS_DIR, 'global');
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    // Archivo global diario
    const dateStr = getCurrentDateString();
    const globalLogFile = path.join(globalDir, `global-${dateStr}.log`);
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

    // Crear directorio para global si no existe
    const globalDir = path.join(LOGS_DIR, 'global');
    if (!fs.existsSync(globalDir)) {
      fs.mkdirSync(globalDir, { recursive: true });
    }

    const dateStr = getCurrentDateString();
    const globalLogFile = path.join(globalDir, `global-${dateStr}.log`);
    try {
      fs.appendFileSync(globalLogFile, logMessage);
    } catch (error) {
      console.error('Error writing to global log file:', error);
    }
  },
};
