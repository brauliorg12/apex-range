import { ActivityType, Client, Guild } from 'discord.js';
import { getTotalUniquePlayers, getOnlinePlayerCount } from './player-stats';

export async function updateBotPresence(client: Client, guild: Guild) {
  try {
    const [registered, online] = await Promise.all([
      getTotalUniquePlayers(guild),
      getOnlinePlayerCount(guild),
    ]);

    client.user?.setActivity(
      `👥 ${registered} registrados | 🟢 ${online} en línea`,
      {
        type: ActivityType.Watching,
      }
    );
  } catch (error) {
    console.error('Error al actualizar la presencia del bot:', error);
  }
}
