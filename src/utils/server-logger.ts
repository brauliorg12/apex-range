import * as fs from 'fs';
import * as path from 'path';

const LOGS_DIR = path.join(__dirname, '../../logs');

// Crear directorio de logs si no existe
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

/**
 * Logger específico para cada servidor de Discord
 */
export class ServerLogger {
  private guildId: string;
  private logFile: string;

  constructor(guildId: string, guildName?: string) {
    this.guildId = guildId;
    const safeName = guildName
      ? guildName.replace(/[^a-zA-Z0-9]/g, '_')
      : 'unknown';
    this.logFile = path.join(LOGS_DIR, `guild_${guildId}_${safeName}.log`);
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
      fs.appendFileSync(this.logFile, content);
    } catch (error) {
      console.error(`Error writing to log file ${this.logFile}:`, error);
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

    // También escribir a un archivo global
    const globalLogFile = path.join(LOGS_DIR, 'global.log');
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

    const globalLogFile = path.join(LOGS_DIR, 'global.log');
    try {
      fs.appendFileSync(globalLogFile, logMessage);
    } catch (error) {
      console.error('Error writing to global log file:', error);
    }
  },
};
