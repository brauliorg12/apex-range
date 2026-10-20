import type { Guild } from 'discord.js';
import type { ApexStatusState } from '../../interfaces/bot-state';
import { writeApexStatusState } from '../../utils/state-manager';
import type { ApexLogger, StateWithGuild } from './types';

export interface ResolvedApexPanelState {
  baseState: StateWithGuild;
  effectiveState: StateWithGuild;
  channelId: string;
  knownMessageId?: string;
  hasFreshMemoryPanel: boolean;
}

interface KnownApexPanel {
  messageId: string;
  channelId?: string;
}

const recoveredPanels = new Map<string, KnownApexPanel>();

/**
 * Guarda en memoria el panel confirmado en Discord.
 * Sirve como respaldo si falla la escritura de `.bot-state`.
 *
 * @param guildId ID del guild.
 * @param messageId ID del mensaje del panel.
 * @param channelId ID del canal donde esta el panel (opcional).
 */
export function rememberApexPanelMessage(
  guildId: string,
  messageId: string,
  channelId?: string
): void {
  recoveredPanels.set(guildId, { messageId, channelId });
}

/**
 * Obtiene el ultimo ID de panel confirmado en memoria para un guild.
 *
 * @param guildId ID del guild.
 * @returns El ID confirmado o `undefined` si no hay ninguno.
 */
export function getKnownApexMessageId(guildId: string): string | undefined {
  return recoveredPanels.get(guildId)?.messageId;
}

/**
 * Obtiene el canal del ultimo panel confirmado en memoria para un guild.
 *
 * @param guildId ID del guild.
 * @returns El ID del canal o `undefined` si no se registro.
 */
export function getKnownApexChannelId(guildId: string): string | undefined {
  return recoveredPanels.get(guildId)?.channelId;
}

/**
 * Elimina el estado en memoria de un guild que ya no usa el bot.
 *
 * @param guildId ID del guild.
 */
export function forgetApexPanelMessage(guildId: string): void {
  recoveredPanels.delete(guildId);
}

/**
 * Combina el estado persistido con el estado confirmado en memoria.
 * Cuando existe un panel confirmado en memoria, el estado resuelto descarta
 * suspensiones e intentos persistidos que puedan estar desactualizados.
 *
 * @param guild Guild del servidor.
 * @param apexStatusState Estado leido de `.bot-state`, o `null`.
 * @returns El estado resuelto o `null` si no hay canal configurado.
 */
export function resolveApexPanelState(
  guild: Guild,
  apexStatusState: ApexStatusState | null
): ResolvedApexPanelState | null {
  const knownChannelId = getKnownApexChannelId(guild.id);
  const channelId = knownChannelId ?? apexStatusState?.channelId;

  if (!channelId) return null;

  const baseState: StateWithGuild = {
    ...(apexStatusState ?? {}),
    channelId,
    guildId: guild.id,
  };

  const knownMessageId = getKnownApexMessageId(guild.id);
  const hasFreshMemoryPanel =
    !!knownMessageId && knownMessageId !== baseState.apexInfoMessageId;

  const effectiveState: StateWithGuild = hasFreshMemoryPanel
    ? {
        ...baseState,
        apexInfoMessageId: knownMessageId,
        recoveryAttempts: 0,
        lastRecoveryAt: undefined,
        recoverySuspendedUntil: undefined,
      }
    : baseState;

  return {
    baseState,
    effectiveState,
    channelId,
    knownMessageId,
    hasFreshMemoryPanel,
  };
}

/**
 * Persiste el estado de Apex sin interrumpir el flujo si falla el disco.
 * El ID confirmado en memoria prevalece sobre el ID persistido.
 *
 * @param guild Guild donde se guarda el estado.
 * @param state Estado a persistir.
 * @param logger Logger del guild.
 * @returns `true` si se guardo; `false` si fallo la escritura.
 */
export async function persistApexState(
  guild: Guild,
  state: StateWithGuild,
  logger: ApexLogger
): Promise<boolean> {
  try {
    const knownPanel = recoveredPanels.get(guild.id);
    const stateToPersist = knownPanel
      ? {
          ...state,
          apexInfoMessageId: knownPanel.messageId,
          channelId: knownPanel.channelId ?? state.channelId,
        }
      : state;

    await writeApexStatusState(stateToPersist);
    return true;
  } catch (error) {
    logger.error('No se pudo guardar el estado de Apex', error);
    return false;
  }
}
