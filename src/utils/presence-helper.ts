import { ActivityType, Client } from 'discord.js';
import { getGlobalPlayerStats } from './global-player-stats';

/**
 * Actualiza la presencia del bot en Discord mostrando estadísticas globales
 * de TODOS los servidores donde está configurado.
 */
export async function updateBotPresence(client: Client) {
  try {
    const stats = await getGlobalPlayerStats(client);

    client.user?.setActivity(
      `🟢 ${stats.online} en línea | 👥 ${stats.total} registrados | 🌐 ${stats.servers} servidores`,
      {
        type: ActivityType.Watching,
      }
    );
  } catch (error) {
    console.error('Error al actualizar la presencia del bot:', error);
  }
}
