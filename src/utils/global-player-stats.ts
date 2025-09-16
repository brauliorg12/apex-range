import { Client } from 'discord.js';
import { getPlayerStats } from './player-stats';
import { readRolesState } from './state-manager';

/**
 * Obtiene estadísticas globales combinadas de todos los servidores configurados.
 */
export async function getGlobalPlayerStats(client: Client) {
  let totalPlayers = 0;
  let totalOnline = 0;
  let configuredServers = 0;

  // Procesar cada servidor donde el bot está presente
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      // Verificar si el servidor tiene configuración
      const rolesState = await readRolesState(guildId);
      if (rolesState?.guildId) {
        const stats = await getPlayerStats(guild);
        totalPlayers += stats.total;
        totalOnline += stats.online;
        configuredServers++;
      }
    } catch (error) {
      console.error(`Error obteniendo stats para guild ${guildId}:`, error);
    }
  }

  return {
    total: totalPlayers,
    online: totalOnline,
    servers: configuredServers,
  };
}
