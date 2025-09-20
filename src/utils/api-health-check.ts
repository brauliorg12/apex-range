import { setGlobalApiStatus } from './global-api-status';
import { logApp } from './logger';

/**
 * Realiza un chequeo de salud a la API especificada.
 * @param apiUrl URL de la API a chequear. Si no se provee, se usa process.env.API_URL.
 * @returns true si la API responde correctamente, false en caso contrario.
 */
export async function checkApiHealth(apiUrl?: string): Promise<boolean> {
  // Determina la URL de la API a chequear
  const url = apiUrl || process.env.API_URL;
  if (!url) {
    // Si no hay URL, marca la API como caída y retorna false
    console.warn(
      '[API] No se ha definido la URL de la API para el chequeo de salud.'
    );
    setGlobalApiStatus(false);
    return false;
  }

  // Crea un controlador para abortar la petición si tarda demasiado
  const controller = new AbortController();
  // Establece un timeout de 5 segundos para abortar la petición
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    // Realiza la petición fetch con soporte para abortar por timeout
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      // Si la respuesta es exitosa, marca la API como UP y retorna true
      const now = new Date();
      setGlobalApiStatus(true, now);
      await logApp(`La API está UP (${now.toLocaleString()})`);
      return true;
    } else {
      // Si la respuesta no es exitosa, marca la API como caída y retorna false
      setGlobalApiStatus(false);
      await logApp(`La API respondió con status: ${res.status}`);
      return false;
    }
  } catch (error) {
    // Si ocurre un error (incluyendo timeout), marca la API como caída
    setGlobalApiStatus(false);
    // Maneja específicamente el error de timeout
    if (error instanceof Error && error.name === 'AbortError') {
      await logApp('Timeout al chequear la API.');
    } else {
      await logApp(`Error al chequear la API: ${error}`);
    }
    return false;
  }
}
