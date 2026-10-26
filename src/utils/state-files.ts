import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logApp } from './logger';

// #region Constantes

/** Directorio donde se persiste `.bot-state`. */
const STATE_DIR = path.join(__dirname, '../../.bot-state');

/** Directorio donde se persisten los `players_*.json`. */
export const PLAYERS_DIR = path.resolve(__dirname, '../../db');

// #endregion

// #region Estado

/** Locks de escritura por guild para `players_*.json`. */
export const playerWriteLocks = new Map<string, Promise<void>>();

/** Locks de escritura por guild para `.bot-state`. */
export const rolesStateWriteLocks = new Map<string, Promise<void>>();

/**
 * Serializa una operación de escritura por guild sobre un mapa de locks.
 *
 * La tarea no debe invocar otra escritura bloqueada para el mismo guild.
 *
 * @typeParam T - Tipo de resultado de la operación protegida.
 * @param locks - Mapa de locks compartido por tipo de archivo.
 * @param guildId - El ID único del servidor de Discord.
 * @param task - Operación que se ejecuta con el lock tomado.
 * @returns El resultado de `task`.
 * @throws {Error} El error propagado por `task`.
 */
export async function withGuildWriteLock<T>(
  locks: Map<string, Promise<void>>,
  guildId: string,
  task: () => Promise<T>
): Promise<T> {
  const previous = locks.get(guildId) ?? Promise.resolve();
  let release!: () => void;
  const lock = new Promise<void>((resolve) => {
    release = resolve;
  });
  locks.set(guildId, lock);

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (locks.get(guildId) === lock) {
      locks.delete(guildId);
    }
  }
}

// #endregion

// #region Archivos de estado

/**
 * Genera la ruta completa del archivo de estado para un servidor específico.
 * Los archivos de estado se almacenan en el directorio .bot-state con el formato {guildId}.json.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns La ruta completa del archivo de estado
 */
export function getStateFile(guildId: string): string {
  return path.join(STATE_DIR, `${guildId}.json`);
}

/**
 * Genera la ruta del archivo de jugadores de un guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns La ruta absoluta del archivo `players_*.json`.
 */
export function getPlayersFile(guildId: string): string {
  return path.join(PLAYERS_DIR, `players_${guildId}.json`);
}

/**
 * Convierte un error desconocido en un mensaje legible.
 *
 * @param error - Error recibido.
 * @returns El mensaje del error o su representación en texto.
 */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Indica si un error de filesystem corresponde a un archivo inexistente.
 *
 * @param error - Error recibido.
 * @returns `true` si el error corresponde a `ENOENT`.
 */
export function isNotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return 'code' in error && error.code === 'ENOENT';
}

/**
 * Resultado de una escritura atómica.
 */
export interface AtomicWriteResult {
  /** Indica si el `rename` falló y se usó la escritura directa. */
  usedFallback: boolean;
}

/**
 * Escribe un archivo de texto con un temporal en el mismo directorio y un
 * `rename` atómico.
 *
 * Si el `rename` falla, registra el problema y reintenta con escritura
 * directa. El archivo temporal se elimina siempre al finalizar.
 *
 * @param file - Ruta absoluta del archivo final.
 * @param payload - Contenido a persistir.
 * @returns Si la escritura usó el fallback directo.
 * @throws {Error} Si falla la escritura temporal o la escritura final.
 */
export async function writeFileAtomic(
  file: string,
  payload: string
): Promise<AtomicWriteResult> {
  const tempFile = `${file}.${randomUUID()}.tmp`;
  let usedFallback = false;

  try {
    await fs.writeFile(tempFile, payload, 'utf8');
    try {
      await fs.rename(tempFile, file);
    } catch (renameError) {
      usedFallback = true;
      await logApp(
        `[state-manager] Escritura atómica falló para ${file}; ` +
          `se usa escritura directa: ${describeError(renameError)}`
      ).catch(() => {});
      await fs.writeFile(file, payload, 'utf8');
    }
  } finally {
    await fs.rm(tempFile, { force: true }).catch(() => {});
  }

  return { usedFallback };
}

/**
 * Persiste `.bot-state` sin tomar el lock por guild.
 *
 * El llamador debe mantener `rolesStateWriteLocks` para ese guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param state - Estado completo a persistir.
 * @returns Si la escritura usó el fallback directo.
 * @throws {Error} Si falla la escritura.
 */
async function writeStateFile(
  guildId: string,
  state: object
): Promise<AtomicWriteResult> {
  await fs.mkdir(STATE_DIR, { recursive: true });
  return writeFileAtomic(
    getStateFile(guildId),
    JSON.stringify(state, null, 2)
  );
}

/**
 * Describe los campos modificados de un estado sin incluir sus valores.
 *
 * @param changes - Campos que se van a persistir.
 * @returns Los nombres ordenados de los campos o `sin-cambios` si no hay.
 */
function describeChangedFields(changes: object): string {
  const fields = Object.keys(changes).sort();
  return fields.length > 0 ? fields.join(',') : 'sin-cambios';
}

/**
 * Persiste `.bot-state` con logs de inicio, éxito, fallback y error.
 *
 * Solo registra nombres de campos y duración; nunca valores del estado.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param state - Estado completo a persistir.
 * @param changes - Campos modificados, usados solo para el log.
 * @throws {Error} Si falla la escritura.
 */
export async function persistStateFile(
  guildId: string,
  state: object,
  changes: object
): Promise<void> {
  const changedFields = describeChangedFields(changes);
  const startedAt = performance.now();
  await logApp(
    `[state] Inicio de escritura de .bot-state: guild=${guildId} ` +
      `campos=[${changedFields}]`
  ).catch(() => {});

  try {
    const result = await writeStateFile(guildId, state);
    const elapsedMs = Math.round(performance.now() - startedAt);

    await logApp(
      `[state] .bot-state escrito: guild=${guildId} ` +
        `campos=[${changedFields}] fallback=${result.usedFallback}`,
      elapsedMs
    ).catch(() => {});
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - startedAt);
    await logApp(
      `[state] Error al escribir .bot-state: guild=${guildId} ` +
        `campos=[${changedFields}]: ${describeError(error)}`,
      elapsedMs
    ).catch(() => {});
    throw error;
  }
}

// #endregion
