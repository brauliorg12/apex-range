import * as fs from 'fs/promises';
import * as path from 'path';

export interface BotState {
  roleCountMessageId?: string;
  roleSelectionMessageId?: string;
  apexInfoMessageId?: string;
  channelId?: string;
  guildId?: string;
}

const STATE_FILE_PATH = path.join(__dirname, '..', '..', 'bot-state.json');
const DB_DIR = path.resolve(__dirname, '../../db');

export async function readState(): Promise<BotState> {
  try {
    await fs.access(STATE_FILE_PATH);
    const data = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

export async function writeState(state: BotState): Promise<void> {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

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
