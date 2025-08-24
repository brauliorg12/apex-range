import { readPlayers, writePlayers } from './state-manager';

// ...existing code...

export async function getPlayers(guildId: string) {
  return await readPlayers(guildId);
}

export async function savePlayers(guildId: string, players: any[]) {
  await writePlayers(guildId, players);
}

// ...actualiza todas las funciones internas para recibir guildId y usar getPlayers/savePlayers...
