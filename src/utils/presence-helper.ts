import { ActivityType, Client, Guild } from 'discord.js';
import { getPlayerStats } from './player-stats';

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
