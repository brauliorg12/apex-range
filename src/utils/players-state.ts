import * as fs from 'fs/promises';
import type { PlayerRecord } from '../interfaces/player';
import {
  cachePlayersSnapshot,
  invalidatePlayersCache,
} from './players-cache';
import {
  describeError,
  getPlayersFile,
  isNotFoundError,
  PLAYERS_DIR,
  playerWriteLocks,
  withGuildWriteLock,
  writeFileAtomic,
} from './state-files';

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
 * Resultado de una lectura estricta de la base de jugadores.
 *
 * - `ok`: el archivo contiene un array válido.
 * - `missing`: el archivo no existe.
 * - `invalid`: el contenido no es JSON válido o no es un array.
 * - `io-error`: falló la lectura por un error del sistema de archivos.
 */
export type PlayersReadResult =
  | { status: 'ok'; players: unknown[]; raw: string }
  | { status: 'missing' }
  | { status: 'invalid'; error: string }
  | { status: 'io-error'; error: string };

/**
 * Serializa los jugadores con indentación de 2 espacios.
 *
 * Conserva la legibilidad de `players_*.json` para inspección y restauración
 * manual. La comparación de `mutatePlayers` usa esta misma representación para
 * evitar serializar el array más de una vez por mutación.
 *
 * @param players - Jugadores a serializar.
 * @returns El JSON indentado.
 */
function serializePlayers(players: readonly unknown[]): string {
  return JSON.stringify(players, null, 2);
}

/**
 * Escribe la base de jugadores con la misma escritura atómica que `.bot-state`.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param payload - Contenido JSON ya serializado.
 * @throws {Error} Si falla la escritura temporal o la escritura final.
 */
async function writePlayersFile(
  guildId: string,
  payload: string
): Promise<void> {
  await fs.mkdir(PLAYERS_DIR, { recursive: true });
  await writeFileAtomic(getPlayersFile(guildId), payload);
}

/**
 * Lee el archivo de jugadores de un guild distinguiendo archivo inexistente,
 * JSON inválido y error de IO.
 *
 * No cambia el comportamiento tolerante de `readPlayers`; existe para los
 * flujos que necesitan abortar cuando los datos no son confiables. El estado
 * `ok` incluye el texto original para compararlo sin volver a serializar.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @returns El resultado tipado de la lectura.
 * @throws {Error} Si el guildId no es válido o no se puede preparar el directorio.
 */
export async function readPlayersStrict(
  guildId: string
): Promise<PlayersReadResult> {
  ensureGuildId(guildId);
  await fs.mkdir(PLAYERS_DIR, { recursive: true });
  const file = getPlayersFile(guildId);

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

  if (!Array.isArray(data)) {
    return {
      status: 'invalid',
      error: 'El archivo no contiene un array de jugadores.',
    };
  }

  return { status: 'ok', players: data, raw };
}

/**
 * Lee la base de datos completa de jugadores registrados para un servidor específico.
 * Los datos incluyen información de usuarios que han seleccionado rangos de Apex Legends.
 *
 * Mantiene el comportamiento tolerante histórico: ante archivo ausente, JSON
 * inválido o error de lectura devuelve un array vacío. Para distinguir esos
 * casos, usar `readPlayersStrict`.
 *
 * @param guildId - El ID único del servidor de Discord
 * @returns Array de objetos de jugador, o array vacío si no se puede leer
 * @throws Error si el guildId no es válido
 */
export async function readPlayers(guildId: string): Promise<any[]> {
  const result = await readPlayersStrict(guildId);
  return result.status === 'ok' ? result.players : [];
}

/**
 * Aplica una mutación sobre los jugadores de un guild con lectura y escritura
 * dentro del mismo lock.
 *
 * Si el archivo no existe se parte de un array vacío. Si la lectura es
 * `invalid` o `io-error`, no se sobrescribe el archivo y se propaga un error.
 * Solo se escribe cuando la mutación cambia el contenido serializado.
 *
 * La comparación usa el `raw` leído y una única serialización con indentación
 * de 2 espacios. Si el contenido no cambió, el archivo no se reescribe. Al
 * terminar, la cache se actualiza o se invalida si el archivo no se puede leer.
 *
 * @typeParam T - Resultado que devuelve el mutador.
 * @param guildId - El ID único del servidor de Discord.
 * @param mutator - Función que muta el array en sitio y devuelve un resultado.
 * @returns El resultado del mutador.
 * @throws {Error} Si el guildId no es válido, el archivo no es legible o falla
 *   la escritura.
 */
export async function mutatePlayers<T>(
  guildId: string,
  mutator: (players: PlayerRecord[]) => T | Promise<T>
): Promise<T> {
  ensureGuildId(guildId);

  return withGuildWriteLock(playerWriteLocks, guildId, async () => {
    const result = await readPlayersStrict(guildId);

    if (result.status === 'invalid' || result.status === 'io-error') {
      invalidatePlayersCache(guildId);
      throw new Error(
        `No se actualizó players_${guildId}.json: ` +
          `${result.status}: ${result.error}`
      );
    }

    const players =
      result.status === 'ok' ? (result.players as PlayerRecord[]) : [];
    const before = result.status === 'ok' ? result.raw : serializePlayers([]);
    const value = await mutator(players);
    const after = serializePlayers(players);
    if (after !== before) {
      try {
        await writePlayersFile(guildId, after);
      } catch (error) {
        invalidatePlayersCache(guildId);
        throw error;
      }
    }

    await cachePlayersSnapshot(guildId, players, after);

    return value;
  });
}
