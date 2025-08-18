import * as fs from 'fs/promises';
import * as path from 'path';

const dataPath = path.join(__dirname, '..', '..', 'players.json');

interface PlayerData {
  [userId: string]: {
    assignedAt: string; // ISO 8601 date string
  };
}

async function readPlayerData(): Promise<PlayerData> {
  try {
    await fs.access(dataPath);
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(fileContent) as PlayerData;
  } catch (error) {
    // Si el archivo no existe o hay un error, devuelve un objeto vacío
    return {};
  }
}

async function writePlayerData(data: PlayerData): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function updatePlayerRankDate(userId: string): Promise<void> {
  const data = await readPlayerData();
  data[userId] = {
    assignedAt: new Date().toISOString(),
  };
  await writePlayerData(data);
}

export async function removePlayerRankDate(userId: string): Promise<void> {
  const data = await readPlayerData();
  if (data[userId]) {
    delete data[userId];
    await writePlayerData(data);
  }
}

export async function getPlayerData(): Promise<PlayerData> {
  return readPlayerData();
}
