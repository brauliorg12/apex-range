/**
 * Ejecuta una función asíncrona con reintentos automáticos en caso de error.
 * - Si la función falla, espera un tiempo antes de volver a intentar.
 * - Reintenta hasta el número máximo de intentos especificado.
 * - Si todos los intentos fallan, lanza el último error capturado.
 *
 * @param fn Función asíncrona que se desea ejecutar.
 * @param retries Número máximo de intentos (por defecto 3).
 * @param delayMs Milisegundos de espera entre cada intento (por defecto 1000ms).
 * @returns El resultado de la función si tiene éxito.
 * @throws El último error si todos los intentos fallan.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
  }
  throw lastError;
}
