import * as fs from 'fs/promises';
import * as path from 'path';

export interface BotState {
  roleCountMessageId?: string;
  roleSelectionMessageId?: string;
  channelId?: string;
  guildId?: string;
}

const STATE_FILE_PATH = path.join(__dirname, '..', '..', 'bot-state.json');

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
