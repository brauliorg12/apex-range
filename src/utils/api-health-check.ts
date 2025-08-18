import fetch from 'node-fetch';
import { setApiStatus } from './api-status';

export async function checkApiHealth(apiUrl?: string): Promise<boolean> {
  const url = apiUrl || process.env.API_URL;
  if (!url) {
    console.warn(
      '[API] No se ha definido la URL de la API para el chequeo de salud.'
    );
    setApiStatus(false);
    return false;
  }
  try {
    const res = await fetch(url, { timeout: 5000 });
    if (res.ok) {
      setApiStatus(true);
      console.log('[API] La API está UP');
      return true;
    } else {
      setApiStatus(false);
      console.warn(`[API] La API respondió con status: ${res.status}`);
      return false;
    }
  } catch (error) {
    setApiStatus(false);
    console.error('[API] Error al chequear la API:', error);
    return false;
  }
}
