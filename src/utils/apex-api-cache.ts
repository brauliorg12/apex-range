import { promises as fs } from 'fs';
import path from 'path';
import { logApp } from './logger';

const CACHE_DIR = path.join(__dirname, '../../.apex-cache');

// Se asegura de que el directorio de caché exista, creándolo si es necesario.
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch {}
}

// Genera la ruta del archivo de caché usando la clave, guildId y channelId.
function getCacheFile(key: string, guildId?: string, channelId?: string) {
  if (!guildId || !channelId) {
    throw new Error(
      `[ApexCache] ¡guildId y channelId son obligatorios para la cache!`
    );
  }
  return path.join(CACHE_DIR, `${key}_${guildId}_${channelId}.json`);
}

// Escribe datos en la caché para una clave específica, junto con la marca de tiempo actual.
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
    await logApp(
      `Escribiendo cache: ${file} (${key})${
        guildId ? ` guildId=${guildId}` : ''
      }${channelId ? ` channelId=${channelId}` : ''}`
    );
  } catch (err) {
    await logApp(`Error al escribir cache: ${file} - ${err}`);
  }
}

// Lee y devuelve los datos y la marca de tiempo de la caché para una clave específica.
export async function readApiCache(
  key: string,
  guildId?: string,
  channelId?: string
): Promise<{ data: any; ts: number } | null> {
  const file = getCacheFile(key, guildId, channelId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    await logApp(
      `Leyendo cache: ${file} (${key})${guildId ? ` guildId=${guildId}` : ''}${
        channelId ? ` channelId=${channelId}` : ''
      }`
    );
    return JSON.parse(raw);
  } catch (err) {
    await logApp(`No se encontró cache: ${file}`);
    return null;
  }
}

// Elimina los archivos de caché para las claves predefinidas usando guildId y channelId.
export async function clearApiCache(guildId?: string, channelId?: string) {
  const keys = ['mapRotation', 'predatorRank', 'serverStatus'];
  for (const key of keys) {
    const file = getCacheFile(key, guildId, channelId);
    try {
      await fs.unlink(file);
      await logApp(`Cache eliminada: ${file}`);
    } catch {
      // No existe, no pasa nada
    }
  }
}
