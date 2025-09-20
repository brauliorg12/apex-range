import * as fs from 'fs/promises';
import * as path from 'path';
import {
  ApexStatusState,
  RolesState,
  BotControlState,
} from '../interfaces/bot-state';

const STATE_DIR = path.join(__dirname, '../../.bot-state');

/**
 * Genera la ruta completa del archivo de estado para un servidor específico.
 * Los archivos de estado se almacenan en el directorio .bot-state con el formato {guildId}.json.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns La ruta completa del archivo de estado
 */
function getStateFile(guildId: string): string {
  return path.join(STATE_DIR, `${guildId}.json`);
}

// --- Gestión del estado de Roles ---

/**
 * Lee el estado de configuración de roles para un servidor específico desde el disco.
 * Este estado incluye información sobre canales, mensajes y configuración de rangos.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns El estado de roles si existe, null si no se encuentra o hay errores
 */
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
 * Guarda el estado de configuración de roles para un servidor específico en el disco.
 * Crea automáticamente el directorio .bot-state si no existe.
 *
 * @param state - El estado de roles a guardar, incluyendo el guildId requerido
 * @throws Error si no se proporciona guildId
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

/**
 * Lee el estado de configuración del comando /apex-status para un servidor específico.
 * Este estado incluye información sobre el canal y mensaje donde se muestran las estadísticas de Apex.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns El estado de Apex Status si existe, null si no se encuentra o hay errores de formato
 */
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

/**
 * Guarda el estado de configuración del comando /apex-status para un servidor específico.
 * El estado se combina con el estado de roles existente en el mismo archivo JSON.
 *
 * @param state - El estado de Apex Status a guardar, incluyendo el guildId requerido
 * @throws Error si no se proporciona guildId
 */
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

// --- Gestión del estado del Canal de Control ---

/**
 * Lee el estado de configuración del canal de control del bot para un servidor específico.
 * Este estado incluye información sobre el canal donde el bot envía logs y notificaciones administrativas.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns El estado del canal de control si existe, null si no se encuentra o hay errores de formato
 */
export async function readBotControlState(
  guildId: string
): Promise<BotControlState | null> {
  const file = getStateFile(guildId);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const data = JSON.parse(raw);
    // Si data es un array (estado corrupto), retornar null
    if (Array.isArray(data)) {
      return null;
    }
    return data.botControl || null;
  } catch {
    return null;
  }
}

/**
 * Guarda el estado de configuración del canal de control del bot para un servidor específico.
 * El estado se combina con el estado de roles existente en el mismo archivo JSON.
 *
 * @param state - El estado del canal de control a guardar, incluyendo el guildId requerido
 * @throws Error si no se proporciona guildId
 */
export async function writeBotControlState(
  state: BotControlState & { guildId: string }
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
    JSON.stringify({ ...current, botControl: state }, null, 2)
  );
}

/**
 * Función de aserción que valida que el guildId proporcionado sea una cadena válida.
 * Lanza un error detallado si el guildId es nulo, indefinido, vacío o tiene valores inválidos.
 * Esta función se usa para asegurar la integridad de los datos antes de acceder a la base de datos.
 *
 * @param guildId - El ID del servidor a validar (puede ser string, null o undefined)
 * @throws Error con mensaje descriptivo si el guildId no es válido
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
 * Lee la base de datos completa de jugadores registrados para un servidor específico.
 * Los datos incluyen información de usuarios que han seleccionado rangos de Apex Legends.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns Array de objetos de jugador, o array vacío si no existe el archivo
 * @throws Error si el guildId no es válido
 */
export async function readPlayers(guildId: string): Promise<any[]> {
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
 * Guarda la base de datos completa de jugadores para un servidor específico.
 * Sobrescribe completamente el archivo existente con los nuevos datos.
 *
 * @param guildId - El ID único del servidor de Discord
 * @param players - Array de objetos de jugador a guardar
 * @throws Error si el guildId no es válido
 */
export async function writePlayers(
  guildId: string,
  players: any[]
): Promise<void> {
  ensureGuildId(guildId);
  const DB_DIR = path.resolve(__dirname, '../../db');
  await fs.mkdir(DB_DIR, { recursive: true });
  const file = path.join(DB_DIR, `players_${guildId}.json`);
  await fs.writeFile(file, JSON.stringify(players, null, 2), 'utf8');
}
