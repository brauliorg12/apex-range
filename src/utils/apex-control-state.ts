import * as fs from 'fs/promises';
import { ApexStatusState, BotControlState } from '../interfaces/bot-state';
import { updateRolesState } from './roles-state';
import { getStateFile } from './state-files';

/**
 * Lee el archivo de estado como objeto plano.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns El objeto deserializado o `null` si no existe, es inválido o es un
 *   array.
 */
async function readStateRecord(
  guildId: string
): Promise<Record<string, unknown> | null> {
  try {
    const raw = await fs.readFile(getStateFile(guildId), 'utf8');
    const data: unknown = JSON.parse(raw);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return null;
    }
    return data as Record<string, unknown>;
  } catch {
    return null;
  }
}

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
  const data = await readStateRecord(guildId);
  return (data?.apexStatus as ApexStatusState | undefined) || null;
}

/**
 * Actualiza el bloque del comando /apex-status sin tocar los demás campos del
 * archivo de estado.
 *
 * Usa la escritura serializada y atómica de `updateRolesState`.
 *
 * @param state - El estado de Apex Status a guardar, incluyendo el guildId requerido.
 * @throws {Error} Si no se proporciona guildId, el estado no es legible o falla
 *   la escritura.
 */
export async function writeApexStatusState(
  state: ApexStatusState & { guildId: string }
): Promise<void> {
  if (!state.guildId) throw new Error('guildId es requerido para el estado');

  await updateRolesState(state.guildId, () => ({ apexStatus: state }));
}

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
  const data = await readStateRecord(guildId);
  return (data?.botControl as BotControlState | undefined) || null;
}

/**
 * Actualiza el bloque del canal de control sin tocar los demás campos del
 * archivo de estado.
 *
 * Usa la escritura serializada y atómica de `updateRolesState`.
 *
 * @param state - El estado del canal de control a guardar, incluyendo el guildId requerido.
 * @throws {Error} Si no se proporciona guildId, el estado no es legible o falla
 *   la escritura.
 */
export async function writeBotControlState(
  state: BotControlState & { guildId: string }
): Promise<void> {
  if (!state.guildId) throw new Error('guildId es requerido para el estado');

  await updateRolesState(state.guildId, () => ({ botControl: state }));
}
