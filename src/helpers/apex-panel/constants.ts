/** Limite de intentos de recuperacion dentro de la ventana. */
export const MAX_RECOVERY_ATTEMPTS = 3;

/** Ventana en la que se cuentan los intentos de recuperacion. */
export const RECOVERY_WINDOW_MS = 60 * 60 * 1000;

/** Tiempo que se suspende la recuperacion tras agotar los intentos. */
export const RECOVERY_SUSPEND_MS = 6 * 60 * 60 * 1000;

/** Espera base entre intentos de recuperacion. */
export const RECOVERY_MIN_INTERVAL_MS = 5 * 60 * 1000;

/** Tope del backoff exponencial entre intentos. */
export const RECOVERY_MAX_BACKOFF_MS = 30 * 60 * 1000;

/** Cooldown de avisos no terminales al canal de control. */
export const RECOVERY_ALERT_COOLDOWN_MS = 60 * 60 * 1000;

/** Frecuencia maxima de limpieza de paneles duplicados. */
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

/** Cantidad de mensajes recientes a revisar al buscar/limpiar paneles. */
export const PANEL_SEARCH_LIMIT = 100;
