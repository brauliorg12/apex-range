import * as fs from 'fs/promises';
import {
  ApexStatusState,
  BotControlState,
  RolesState,
} from '../interfaces/bot-state';
import { notifyCorruptStateAlert } from './admin-alert';
import {
  describeError,
  getStateFile,
  isNotFoundError,
  persistStateFile,
  rolesStateWriteLocks,
  withGuildWriteLock,
} from './state-files';

// #region Tipos

/**
 * Estado completo persistido en `.bot-state/{guildId}.json`.
 *
 * Incluye el bloque de roles y los bloques que administran otros flujos. Las
 * actualizaciones parciales deben preservar los campos que no modifican.
 */
export interface GuildStateFile extends RolesState {
  /** Estado del panel de `/apex-status`. */
  apexStatus?: ApexStatusState;
  /** Estado del canal de control del bot. */
  botControl?: BotControlState;
}

// #endregion

// #region Estado de roles

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
 * Resultado de una lectura estricta de `.bot-state`.
 *
 * - `ok`: el archivo contiene un estado de guild válido.
 * - `missing`: el archivo no existe.
 * - `invalid`: el contenido no es JSON válido o no tiene la forma esperada.
 * - `io-error`: falló la lectura por un error del sistema de archivos.
 */
export type RolesStateReadResult =
  | { status: 'ok'; state: RolesState }
  | { status: 'missing' }
  | { status: 'invalid'; error: string }
  | { status: 'io-error'; error: string };

/**
 * Campos de texto conocidos de `RolesState`.
 */
const ROLES_STATE_STRING_FIELDS = [
  'roleCountMessageId',
  'roleSelectionMessageId',
  'channelId',
  'guildId',
  'rankCatalogSignature',
  'rankPanelHeaderMessageId',
  'rankPanelManagementMessageId',
  'rankPanelUpdatedAt',
] as const;

/**
 * Indica si un valor es un objeto con valores de texto.
 *
 * @param value - Valor a inspeccionar.
 * @returns `true` si es un objeto plano cuyos valores son strings.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(
    (entry: unknown) => typeof entry === 'string'
  );
}

/**
 * Indica si un valor es un array cuyos elementos son strings.
 *
 * @param value - Valor a inspeccionar.
 * @returns `true` si es un array de strings.
 */
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((entry: unknown) => typeof entry === 'string')
  );
}

/**
 * Indica si un valor deserializado tiene la forma esperada de `RolesState`.
 *
 * Valida solo los campos conocidos del bloque de roles y su journal. Los
 * bloques adicionales del archivo (`apexStatus`, `botControl`) se ignoran.
 *
 * @param value - Valor deserializado del archivo.
 * @returns `true` si el valor es un estado de roles compatible.
 */
function isRolesState(value: unknown): value is RolesState {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const hasValidStringFields = ROLES_STATE_STRING_FIELDS.every(
    (field) => record[field] === undefined || typeof record[field] === 'string'
  );
  if (!hasValidStringFields) return false;

  const hasValidJournal =
    (record.rankPanelRebuildInProgress === undefined ||
      typeof record.rankPanelRebuildInProgress === 'boolean') &&
    (record.rankPanelRetiredMessageIds === undefined ||
      isStringArray(record.rankPanelRetiredMessageIds));
  if (!hasValidJournal) return false;

  return (
    record.rankCardMessageIds === undefined ||
    isStringRecord(record.rankCardMessageIds)
  );
}

/**
 * Lee el estado de `.bot-state` de un guild distinguiendo archivo ausente,
 * contenido inválido y error de IO.
 *
 * No cambia el comportamiento tolerante de `readRolesState`; existe para los
 * flujos que necesitan abortar cuando el estado no es confiable.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns El resultado tipado de la lectura.
 */
export async function readRolesStateStrict(
  guildId: string
): Promise<RolesStateReadResult> {
  const file = getStateFile(guildId);

  let raw: string;
  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (error) {
    return isNotFoundError(error)
      ? { status: 'missing' }
      : { status: 'io-error', error: describeError(error) };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    return { status: 'invalid', error: describeError(error) };
  }

  if (!isRolesState(data)) {
    return {
      status: 'invalid',
      error: 'El archivo no contiene un estado de guild válido.',
    };
  }

  return { status: 'ok', state: data };
}

/**
 * Actualiza parcialmente `.bot-state` de un guild y preserva los campos que el
 * mutador no modifica.
 *
 * La lectura y la escritura se serializan por guild. Si el archivo no existe
 * se crea un estado nuevo; si la lectura es `invalid` o `io-error`, no se
 * sobrescribe, se alerta al administrador de la app y se propaga un error.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param mutator - Función que recibe el estado actual y devuelve solo los
 *   campos que se deben reemplazar. No debe mutar el objeto recibido.
 * @throws {Error} Si el guildId no es válido, el estado no es legible o falla
 *   la escritura.
 */
export async function updateRolesState(
  guildId: string,
  mutator: (current: GuildStateFile) => Partial<GuildStateFile>
): Promise<void> {
  if (!guildId) throw new Error('guildId es requerido para el estado');

  const corruption = await withGuildWriteLock(
    rolesStateWriteLocks,
    guildId,
    async (): Promise<'invalid' | 'io-error' | null> => {
      const result = await readRolesStateStrict(guildId);

      if (result.status === 'invalid' || result.status === 'io-error') {
        return result.status;
      }

      const current: GuildStateFile =
        result.status === 'ok' ? result.state : { guildId };
      const changes = mutator({ ...current });
      const next: GuildStateFile = {
        ...current,
        ...changes,
        guildId,
      };

      await persistStateFile(guildId, next, changes);

      return null;
    }
  );

  if (corruption) {
    await notifyCorruptStateAlert({
      guildId,
      errorType: corruption,
      panelIntact: false,
    });
    throw new Error(
      'No se actualizó el estado del guild. Contactá al administrador de la app.'
    );
  }
}

// #endregion
