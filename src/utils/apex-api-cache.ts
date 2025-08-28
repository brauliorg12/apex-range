import { promises as fs } from 'fs';
import path from 'path';

const CACHE_DIR = path.join(__dirname, '../../.apex-cache');

async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

function getCacheFile(key: string, guildId?: string, channelId?: string) {
  if (!guildId || !channelId) {
    throw new Error(
      `[ApexCache] ¡guildId y channelId son obligatorios para la cache!`
    );
  }
  return path.join(CACHE_DIR, `${key}_${guildId}_${channelId}.json`);
}

export async function writeApiCache(
  key: string,
  data: any,
  guildId?: string,
  channelId?: string
) {
  await ensureCacheDir();
  const file = getCacheFile(key, guildId, channelId);
  try {
    await fs.writeFile(file, JSON.stringify({ data, ts: Date.now() }));
    console.log(
      `[ApexCache] Escribiendo cache: ${file} (${key})${
        guildId ? ` guildId=${guildId}` : ''
      }${channelId ? ` channelId=${channelId}` : ''}`
    );
  } catch (err) {
    console.error(`[ApexCache] Error al escribir cache: ${file}`, err);
  }
}

export async function readApiCache(
  key: string,
  guildId?: string,
  channelId?: string
): Promise<{ data: any; ts: number } | null> {
  const file = getCacheFile(key, guildId, channelId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    console.log(
      `[ApexCache] Leyendo cache: ${file} (${key})${
        guildId ? ` guildId=${guildId}` : ''
      }${channelId ? ` channelId=${channelId}` : ''}`
    );
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[ApexCache] No se encontró cache: ${file}`);
    return null;
  }
}

export async function clearApiCache(guildId?: string, channelId?: string) {
  const keys = ['mapRotation', 'predatorRank', 'serverStatus'];
  for (const key of keys) {
    const file = getCacheFile(key, guildId, channelId);
    try {
      await fs.unlink(file);
      console.log(`[ApexCache] Cache eliminada: ${file}`);
    } catch {
      // No existe, no pasa nada
    }
  }
}
