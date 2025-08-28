import * as fs from 'fs/promises';
import * as path from 'path';
import { BotState, RolesState, ApexStatusState } from '../types/bot-state';

const STATE_FILE_PATH = path.join(__dirname, '..', '..', 'bot-state.json');
const DB_DIR = path.resolve(__dirname, '../../db');

// Funciones genéricas para leer y escribir el estado completo
export async function readState(): Promise<BotState> {
  try {
    await fs.access(STATE_FILE_PATH);
    const data = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data) as BotState;
  } catch (error) {
    return {};
  }
}

export async function writeState(state: BotState): Promise<void> {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

// --- Gestión del estado de Roles ---
export async function readRolesState(): Promise<RolesState | undefined> {
  const state = await readState();
  return state.roles;
}

export async function writeRolesState(rolesState: RolesState): Promise<void> {
  const state = await readState();
  const newState: BotState = { ...state, roles: rolesState };
  await writeState(newState);
}

// --- Gestión del estado de Apex Status ---
export async function readApexStatusState(): Promise<ApexStatusState | undefined> {
  const state = await readState();
  return state.apexStatus;
}

export async function writeApexStatusState(
  apexStatusState: ApexStatusState
): Promise<void> {
  const state = await readState();
  const newState: BotState = { ...state, apexStatus: apexStatusState };
  await writeState(newState);
}

// --- Funciones de base de datos de jugadores (sin cambios) ---
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

export async function readPlayers(guildId: string) {
  ensureGuildId(guildId);
  await fs.mkdir(DB_DIR, { recursive: true });
  const file = path.join(DB_DIR, `players_${guildId}.json`);
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function writePlayers(guildId: string, players: any[]) {
  ensureGuildId(guildId);
  await fs.mkdir(DB_DIR, { recursive: true });
  const file = path.join(DB_DIR, `players_${guildId}.json`);
  await fs.writeFile(file, JSON.stringify(players, null, 2), 'utf8');
}