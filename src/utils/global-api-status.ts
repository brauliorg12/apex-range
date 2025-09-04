import { GlobalApiStatus } from '../interfaces/global-api';

const globalApiStatus: GlobalApiStatus = {
  ok: false,
  lastChecked: undefined,
};

/**
 * Actualiza el estado global de la API.
 * @param ok Indica si la API está operativa (true) o caída (false).
 * @param lastChecked Fecha y hora en que se realizó el último chequeo. Si no se provee y la API está caída, se asigna la fecha actual.
 */
export function setGlobalApiStatus(ok: boolean, lastChecked?: Date) {
  globalApiStatus.ok = ok;
  if (lastChecked) {
    globalApiStatus.lastChecked = lastChecked;
  } else if (!ok) {
    globalApiStatus.lastChecked = new Date();
  }
}

/**
 * Obtiene una copia del estado global actual de la API.
 * @returns Objeto GlobalApiStatus con el estado actual.
 */
export function getGlobalApiStatus(): GlobalApiStatus {
  return { ...globalApiStatus };
}
