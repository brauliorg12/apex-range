import { ActivityType, Client, Guild } from 'discord.js';
import { getPlayerStats } from './player-stats';

/**
 * Actualiza la presencia del bot en Discord mostrando el número de jugadores en línea y registrados.
 * Obtiene las estadísticas del servidor y establece el estado del bot con formato visual.
 *
 * @param client Instancia del cliente de Discord.
 * @param guild Servidor de Discord donde se consulta la info.
 */
export async function updateBotPresence(client: Client, guild: Guild) {
  try {
    const stats = await getPlayerStats(guild);

    client.user?.setActivity(
      `🟢 ${stats.online} en línea | 👥 ${stats.total} registrados`,
      {
        type: ActivityType.Watching,
      }
    );
  } catch (error) {
    console.error('Error al actualizar la presencia del bot:', error);
  }
}
