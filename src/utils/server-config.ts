import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ServerConfig } from '../models/server-config';

/**
 * Carga la configuración completa de un servidor específico.
 * @param guildId - ID del servidor de Discord.
 * @returns Objeto ServerConfig con ranks y allowedRoles, o valores por defecto si no existe.
 */
export function loadServerConfig(guildId: string): ServerConfig {
  try {
    const configPath = join(
      __dirname,
      '../../db',
      `server-config-${guildId}.json`
    );
    const data = JSON.parse(readFileSync(configPath, 'utf8'));
    return {
      ranks: data.ranks || data, // Compatibilidad con archivos antiguos que solo tenían ranks
      excludedRoles: data.excludedRoles || [],
    };
  } catch {
    return { ranks: {}, excludedRoles: [] };
  }
}

/**
 * Guarda la configuración completa de un servidor específico.
 * @param guildId - ID del servidor de Discord.
 * @param config - Objeto ServerConfig con ranks y allowedRoles.
 */
export function saveServerConfig(guildId: string, config: ServerConfig) {
  const configPath = join(
    __dirname,
    '../../db',
    `server-config-${guildId}.json`
  );
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Obtiene el nombre de rol mapeado para un servidor, con fallback a por defecto.
 * @param guildId - ID del servidor de Discord.
 * @param shortId - Identificador corto del rango (e.g., 'master').
 * @param defaultName - Nombre por defecto si no hay mapeo.
 * @returns Nombre de rol personalizado o por defecto.
 */
export function getRoleName(
  guildId: string,
  shortId: string,
  defaultName: string
): string {
  const config = loadServerConfig(guildId);
  return config.ranks[shortId] || defaultName;
}
