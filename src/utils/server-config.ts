import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Carga la configuración de roles para un servidor específico.
 * @param guildId - ID del servidor de Discord.
 * @returns Objeto con mapeos de shortId a roleName personalizado, o vacío si no existe.
 */
export function loadServerConfig(guildId: string): Record<string, string> {
  try {
    const configPath = join(__dirname, '../../db', `server-config-${guildId}.json`);
    return JSON.parse(readFileSync(configPath, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Guarda la configuración de roles para un servidor específico.
 * @param guildId - ID del servidor de Discord.
 * @param config - Objeto con mapeos de shortId a roleName.
 */
export function saveServerConfig(guildId: string, config: Record<string, string>) {
  const configPath = join(__dirname, '../../db', `server-config-${guildId}.json`);
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Obtiene el nombre de rol mapeado para un servidor, con fallback a por defecto.
 * @param guildId - ID del servidor de Discord.
 * @param shortId - Identificador corto del rango (e.g., 'master').
 * @param defaultName - Nombre por defecto si no hay mapeo.
 * @returns Nombre de rol personalizado o por defecto.
 */
export function getRoleName(guildId: string, shortId: string, defaultName: string): string {
  const config = loadServerConfig(guildId);
  return config[shortId] || defaultName;
}
