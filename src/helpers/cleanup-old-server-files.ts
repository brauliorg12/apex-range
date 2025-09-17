import { Client } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logApp } from '../utils/logger';

/**
 * Función opcional para limpiar archivos de servidores donde el bot ya no está presente.
 *
 * Esta función verifica archivos de estado y base de datos asociados a servidores (guilds)
 * donde el bot ya no tiene acceso, y opcionalmente los elimina para liberar espacio.
 * Está deshabilitada por defecto para preservar datos históricos.
 *
 * @param client - Instancia del cliente de Discord.js, utilizada para obtener la lista de guilds actuales.
 * @returns Una promesa que se resuelve cuando el proceso de limpieza se completa.
 */
export async function cleanupOldServerFiles(client: Client): Promise<void> {
  try {
    // Definir rutas de directorios para archivos de estado y base de datos
    const stateDir = path.join(__dirname, '../../.bot-state');
    const dbDir = path.join(__dirname, '../../db');

    // Obtener lista de archivos existentes en ambos directorios
    const [stateFiles, dbFiles] = await Promise.all([
      fs.readdir(stateDir).catch(() => []),
      fs.readdir(dbDir).catch(() => []),
    ]);

    // Extraer guildIds de los archivos para identificar servidores existentes
    const existingGuildIds = new Set<string>();

    // Procesar archivos de estado (.json)
    for (const file of stateFiles) {
      if (file.endsWith('.json')) {
        const guildId = file.replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // Procesar archivos de players (players_*.json)
    for (const file of dbFiles) {
      if (file.startsWith('players_') && file.endsWith('.json')) {
        const guildId = file.replace('players_', '').replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // Verificar cuáles guilds ya no están accesibles comparando con guilds actuales
    const currentGuildIds = new Set(client.guilds.cache.map((g) => g.id));
    const obsoleteGuildIds = [...existingGuildIds].filter(
      (id) => !currentGuildIds.has(id)
    );

    if (obsoleteGuildIds.length > 0) {
      console.log(
        `[Cleanup] Encontrados ${obsoleteGuildIds.length} archivos de servidores obsoletos`
      );

      // Limpiar archivos (deshabilitado por defecto)
      // Descomenta las líneas siguientes si quieres activar la limpieza automática:
      /*
      for (const guildId of obsoleteGuildIds) {
        const stateFile = path.join(stateDir, `${guildId}.json`);
        const playersFile = path.join(dbDir, `players_${guildId}.json`);
        
        await fs.unlink(stateFile).catch(() => {});
        await fs.unlink(playersFile).catch(() => {});
        
        logApp(`Archivo limpiado para servidor obsoleto: ${guildId}`);
      }
      
      console.log(`[Cleanup] ${obsoleteGuildIds.length} archivos limpiados`);
      */
    }
  } catch (error) {
    logApp(`Error en cleanup de archivos antiguos: ${error}`);
  }
}
