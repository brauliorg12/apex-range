import { readPlayers } from './state-manager';

/**
 * Obtiene la lista de jugadores registrados para un servidor específico.
 * @param guildId ID del servidor Discord.
 * @returns Un array de jugadores registrados en ese servidor.
 */
export async function getPlayers(guildId: string) {
  return await readPlayers(guildId);
}
