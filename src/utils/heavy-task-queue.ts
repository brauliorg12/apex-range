/**
 * Cola serial para trabajo pesado de cards, canvas y lecturas de jugadores.
 *
 * Mantiene una sola tarea activa para evitar picos de CPU cuando varios guilds
 * o interacciones generan cards al mismo tiempo. Las tareas se encadenan y un
 * error no bloquea a las siguientes.
 */

let tail: Promise<void> = Promise.resolve();

/**
 * Ejecuta una tarea pesada de forma serial.
 *
 * El llamador debe haber reconocido la interacción de Discord antes de
 * encolar trabajo que pueda tardar más de tres segundos.
 *
 * @typeParam T - Resultado de la tarea.
 * @param task - Operación que se ejecutará cuando termine la anterior.
 * @returns El resultado de `task`.
 */
export function runHeavyTask<T>(task: () => Promise<T>): Promise<T> {
  const result = tail.then(task, task);
  tail = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
