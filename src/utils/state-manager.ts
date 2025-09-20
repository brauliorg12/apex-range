import * as fs from 'fs/promises';
import * as path from 'path';
import { ApexStatusState, RolesState } from '../interfaces/bot-state';

const STATE_DIR = path.join(__dirname, '../../.bot-state');

/**
 * Obtiene la ruta del archivo de estado para un servidor específico.
 */
function getStateFile(guildId: string) {
  return path.join(STATE_DIR, `${guildId}.json`);
}

// --- Gestión del estado de Roles ---
export async function readRolesState(
  guildId: string
): Promise<RolesState | null> {
  const file = getStateFile(guildId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Escribe el estado de roles para un servidor específico.
 * Guarda la información de roles en el archivo de estado correspondiente al guildId.
 * Crea el directorio si no existe y lanza un error si falta el guildId.
 */
export async function writeRolesState(
  state: RolesState & { guildId: string }
): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  if (!state.guildId) throw new Error('guildId es requerido para el estado');
  const file = getStateFile(state.guildId);
  await fs.writeFile(file, JSON.stringify(state, null, 2));
}

// --- Gestión del estado de Apex Status ---
export async function readApexStatusState(
  guildId: string
): Promise<ApexStatusState | null> {
  const file = getStateFile(guildId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    // Si data es un array (estado corrupto), retornar null
    if (Array.isArray(data)) {
      return null;
    }
    return data.apexStatus || null;
  } catch {
    return null;
  }
}

export async function writeApexStatusState(
  state: ApexStatusState & { guildId: string }
): Promise<void> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  if (!state.guildId) throw new Error('guildId es requerido para el estado');
  const file = getStateFile(state.guildId);
  let current = {};
  try {
    current = (await readRolesState(state.guildId)) || {};
  } catch {}
  await fs.writeFile(
    file,
    JSON.stringify({ ...current, apexStatus: state }, null, 2)
  );
}

/**
 * Verifica que el guildId sea válido antes de acceder a la base de datos de jugadores.
 * Lanza un error si el guildId es nulo, indefinido o inválido.
 */
function ensureGuildId(
  guildId: string | null | undefined
): asserts guildId is string {
  if (
    !guildId ||
    typeof guildId !== 'string' ||
    guildId === 'undefined' ||
    guildId === 'null'
  ) {
    throw new Error(
      `[DB] guildId inválido al acceder a players DB: "${guildId}"`
    );
  }
}

/**
 * Lee la base de datos de jugadores para un servidor específico.
 * Devuelve un array de jugadores o un array vacío si no existe el archivo.
 */
export async function readPlayers(guildId: string) {
  ensureGuildId(guildId);
  const DB_DIR = path.resolve(__dirname, '../../db');
  await fs.mkdir(DB_DIR, { recursive: true });
  const file = path.join(DB_DIR, `players_${guildId}.json`);
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Escribe la base de datos de jugadores para un servidor específico.
 * Guarda el array de jugadores en el archivo correspondiente.
 */
export async function writePlayers(guildId: string, players: any[]) {
  ensureGuildId(guildId);
  const DB_DIR = path.resolve(__dirname, '../../db');
  await fs.mkdir(DB_DIR, { recursive: true });
  const file = path.join(DB_DIR, `players_${guildId}.json`);
  await fs.writeFile(file, JSON.stringify(players, null, 2), 'utf8');
}
