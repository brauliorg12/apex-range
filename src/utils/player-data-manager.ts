import * as fs from 'fs/promises';
import * as path from 'path';

const dataPath = path.join(__dirname, '..', '..', 'players.json');

export interface PlayerRecord {
  userId: string;
  assignedAt: string; // ISO 8601 date string
}

export type PlayerData = PlayerRecord[];

async function readPlayerData(): Promise<PlayerData> {
  try {
    await fs.access(dataPath);
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const raw = JSON.parse(fileContent) as unknown;

    if (Array.isArray(raw)) {
      return raw as PlayerData;
    }

    // Migración desde el formato antiguo { [userId]: { assignedAt } }
    if (raw && typeof raw === 'object') {
      const migrated: PlayerData = Object.entries(
        raw as Record<string, { assignedAt?: string }>
      ).map(([userId, value]) => ({
        userId,
        assignedAt: value?.assignedAt ?? new Date().toISOString(),
      }));
      await writePlayerData(migrated);
      return migrated;
    }

    return [];
  } catch {
    // Si el archivo no existe o hay un error, devuelve un array vacío
    return [];
  }
}

async function writePlayerData(data: PlayerData): Promise<void> {
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function updatePlayerRankDate(userId: string): Promise<void> {
  const data = await readPlayerData();
  const idx = data.findIndex((r) => r.userId === userId);
  const now = new Date().toISOString();

  if (idx >= 0) {
    data[idx].assignedAt = now;
  } else {
    data.push({ userId, assignedAt: now });
  }

  await writePlayerData(data);
}

export async function removePlayerRankDate(userId: string): Promise<void> {
  const data = await readPlayerData();
  const next = data.filter((r) => r.userId !== userId);
  if (next.length !== data.length) {
    await writePlayerData(next);
  }
}

export async function getPlayerData(): Promise<PlayerData> {
  return readPlayerData();
}

// Utilidad para obtener la fecha por usuario (opcional)
export async function getAssignedAtForUser(
  userId: string
): Promise<string | undefined> {
  const data = await readPlayerData();
  return data.find((r) => r.userId === userId)?.assignedAt;
}
