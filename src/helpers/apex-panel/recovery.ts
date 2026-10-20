import type { Guild, TextChannel } from 'discord.js';
import {
  MAX_RECOVERY_ATTEMPTS,
  RECOVERY_MAX_BACKOFF_MS,
  RECOVERY_MIN_INTERVAL_MS,
  RECOVERY_SUSPEND_MS,
  RECOVERY_WINDOW_MS,
} from './constants';
import { notifyRecovery } from './notifications';
import { persistApexState } from './state';
import type { ApexLogger, ApexNotifyType, StateWithGuild } from './types';

/**
 * Calcula los intentos de recuperacion dentro de la ventana actual.
 *
 * @param state Estado de Apex del guild.
 * @param now Timestamp actual.
 * @returns Cantidad de intentos vigentes.
 */
export function getAttemptsInWindow(
  state: StateWithGuild,
  now: number
): number {
  if (!state.recoveryAttempts) return 0;
  if (
    state.lastRecoveryAt &&
    now - state.lastRecoveryAt > RECOVERY_WINDOW_MS
  ) {
    return 0;
  }
  return state.recoveryAttempts;
}

/**
 * Backoff exponencial entre intentos, con un tope de 30 minutos.
 *
 * @param attempts Intentos previos.
 * @returns Milisegundos de espera.
 */
export function getBackoffMs(attempts: number): number {
  if (attempts <= 0) return 0;
  return Math.min(
    RECOVERY_MIN_INTERVAL_MS * 2 ** (attempts - 1),
    RECOVERY_MAX_BACKOFF_MS
  );
}

/**
 * Registra un fallo recuperable y aplica backoff/suspension.
 *
 * @param guild Guild donde ocurrio el fallo.
 * @param channel Canal del panel, o `null` si no esta disponible.
 * @param state Estado actual.
 * @param logger Logger del guild.
 * @param details Detalle del fallo.
 * @param type Tipo de aviso.
 */
export async function registerFailure(
  guild: Guild,
  channel: TextChannel | null,
  state: StateWithGuild,
  logger: ApexLogger,
  details: string,
  type: ApexNotifyType
): Promise<void> {
  const now = Date.now();
  const attempts = getAttemptsInWindow(state, now) + 1;
  const suspendedUntil =
    attempts >= MAX_RECOVERY_ATTEMPTS
      ? now + RECOVERY_SUSPEND_MS
      : state.recoverySuspendedUntil;

  const newState: StateWithGuild = {
    ...state,
    recoveryAttempts: attempts,
    lastRecoveryAt: now,
    recoverySuspendedUntil: suspendedUntil,
  };

  await persistApexState(guild, newState, logger);

  if (attempts >= MAX_RECOVERY_ATTEMPTS) {
    await notifyRecovery(
      guild,
      channel,
      'recovery_suspended',
      `Intentos: ${attempts}. ${details}`,
      logger
    );
    return;
  }

  await notifyRecovery(guild, channel, type, details, logger);
}

/**
 * Suspende la recuperacion automatica durante un periodo.
 * Se usa para errores de permisos o de canal que no se resuelven con reintentos.
 *
 * @param guild Guild donde ocurrio el fallo.
 * @param channel Canal del panel, o `null` si no esta disponible.
 * @param state Estado actual.
 * @param logger Logger del guild.
 * @param type Tipo de aviso.
 * @param details Detalle del fallo.
 */
export async function suspendRecovery(
  guild: Guild,
  channel: TextChannel | null,
  state: StateWithGuild,
  logger: ApexLogger,
  type: ApexNotifyType,
  details: string
): Promise<void> {
  const now = Date.now();
  const suspendedState: StateWithGuild = {
    ...state,
    recoveryAttempts: MAX_RECOVERY_ATTEMPTS,
    lastRecoveryAt: now,
    recoverySuspendedUntil: now + RECOVERY_SUSPEND_MS,
  };

  await persistApexState(guild, suspendedState, logger);
  await notifyRecovery(guild, channel, type, details, logger);
}


