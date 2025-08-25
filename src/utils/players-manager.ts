import { readPlayers, writePlayers } from './state-manager';

/**
 * Obtiene la lista de jugadores registrados para un servidor específico.
 * @param guildId ID del servidor Discord.
 * @returns Un array de jugadores registrados en ese servidor.
 */
export async function getPlayers(guildId: string) {
  return await readPlayers(guildId);
}

/**
 * Guarda la lista de jugadores para un servidor específico.
 * @param guildId ID del servidor Discord.
 * @param players Array de jugadores a guardar.
 */
export async function savePlayers(guildId: string, players: any[]) {
  await writePlayers(guildId, players);
}
