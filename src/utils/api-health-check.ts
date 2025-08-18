import { setGlobalApiStatus } from './global-api-status';

export async function checkApiHealth(apiUrl?: string): Promise<boolean> {
  const url = apiUrl || process.env.API_URL;
  if (!url) {
    console.warn(
      '[API] No se ha definido la URL de la API para el chequeo de salud.'
    );
    setGlobalApiStatus(false);
    return false;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const now = new Date();
      setGlobalApiStatus(true, now);
      console.log(`[API] La API está UP (${now.toLocaleString()})`);
      return true;
    } else {
      setGlobalApiStatus(false);
      console.warn(`[API] La API respondió con status: ${res.status}`);
      return false;
    }
  } catch (error) {
    setGlobalApiStatus(false);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[API] Timeout al chequear la API.');
    } else {
      console.error('[API] Error al chequear la API:', error);
    }
    return false;
  }
}
