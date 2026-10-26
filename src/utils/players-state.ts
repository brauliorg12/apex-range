import * as fs from 'fs/promises';
import type { PlayerRecord } from '../interfaces/player';
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
  | { status: 'ok'; players: unknown[] }
  | { status: 'missing' }
  | { status: 'invalid'; error: string }
  | { status: 'io-error'; error: string };

/**
 * Escribe la base de jugadores con la misma escritura atómica que `.bot-state`.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param players - Jugadores a persistir.
 * @throws {Error} Si falla la escritura temporal o la escritura final.
 */
async function writePlayersFile(
  guildId: string,
  players: unknown[]
): Promise<void> {
  await fs.mkdir(PLAYERS_DIR, { recursive: true });
  await writeFileAtomic(
    getPlayersFile(guildId),
    JSON.stringify(players, null, 2)
  );
}

/**
 * Lee el archivo de jugadores de un guild distinguiendo archivo inexistente,
 * JSON inválido y error de IO.
 *
 * No cambia el comportamiento tolerante de `readPlayers`; existe para los
 * flujos que necesitan abortar cuando los datos no son confiables.
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

  return { status: 'ok', players: data };
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
      throw new Error(
        `No se actualizó players_${guildId}.json: ` +
          `${result.status}: ${result.error}`
      );
    }

    const players =
      result.status === 'ok' ? (result.players as PlayerRecord[]) : [];
    const before = JSON.stringify(players);
    const value = await mutator(players);

    if (JSON.stringify(players) !== before) {
      await writePlayersFile(guildId, players);
    }

    return value;
  });
}
