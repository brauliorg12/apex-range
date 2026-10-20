import { forgetApexPanelNotifications } from './notifications';
import { forgetApexPanelSearchState } from './search';
import { forgetApexPanelMessage } from './state';

/**
 * Libera el estado en memoria del panel de Apex de un guild.
 * Se usa cuando el bot es removido del servidor para evitar acumulacion.
 * No borra los JSON historicos de `.bot-state` ni de `db`.
 *
 * @param guildId ID del guild.
 */
export function clearApexPanelMemory(guildId: string): void {
  forgetApexPanelMessage(guildId);
  forgetApexPanelNotifications(guildId);
  forgetApexPanelSearchState(guildId);
}
