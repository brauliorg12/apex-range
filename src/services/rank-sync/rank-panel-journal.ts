import { Guild, TextChannel } from 'discord.js';
import { RolesState } from '../../interfaces/bot-state';
import { updateRolesState } from '../../utils/state-manager';
import { getRankCatalogSignature } from './rank-catalog';
import { deletePanelMessages } from './rank-panel-deletion';
import { getActivePanelMessageIds } from './rank-panel-cleanup';
import {
  RankPanelJournalState,
  RankPanelMessageIds,
  RankPanelRecoveryResult,
} from './rank-panel-types';

/**
 * Persiste los IDs del panel, la firma del catálogo y el journal de limpieza,
 * preservando los campos que no administra, como `apexStatus`, `botControl` y
 * el resto del estado.
 *
 * La escritura se serializa por guild y es atómica. Si se omite el journal, se
 * limpian la marca de rebuild y los IDs retirados; ese es el comportamiento del
 * setup, que no participa del cierre transaccional del sync.
 *
 * @param guild - Guild al que pertenece el panel.
 * @param channelId - ID del canal donde está publicado el panel.
 * @param messageIds - IDs de los mensajes del panel.
 * @param journal - Journal de limpieza a persistir, si corresponde.
 * @throws {Error} Si el estado actual no es legible o falla la escritura de
 *   `.bot-state`.
 */
export async function persistRankPanelState(
  guild: Guild,
  channelId: string,
  messageIds: RankPanelMessageIds,
  journal?: RankPanelJournalState
): Promise<void> {
  await updateRolesState(guild.id, () => ({
    channelId,
    rankCardMessageIds: messageIds.cardMessageIds,
    rankPanelHeaderMessageId: messageIds.headerMessageId,
    rankPanelManagementMessageId: messageIds.managementMessageId,
    rankCatalogSignature: getRankCatalogSignature(),
    rankPanelUpdatedAt: new Date().toISOString(),
    rankPanelRebuildInProgress: journal?.rebuildInProgress ? true : undefined,
    rankPanelRetiredMessageIds:
      journal && journal.retiredMessageIds.length > 0
        ? journal.retiredMessageIds
        : undefined,
  }));
}

/**
 * Marca el inicio de un rebuild antes de enviar el panel nuevo.
 *
 * Conserva los IDs retirados de intentos anteriores y agrega los recolectados
 * en este intento. La marca permite que el próximo sync sepa que el panel
 * nuevo todavía no fue confirmado.
 *
 * @param guildId - ID del guild.
 * @param retiredMessageIds - IDs que quedarán retirados al confirmar el panel.
 * @throws {Error} Si el estado no es legible o falla la escritura.
 */
export async function markRankPanelRebuildInProgress(
  guildId: string,
  retiredMessageIds: string[]
): Promise<void> {
  await updateRolesState(guildId, () => ({
    rankPanelRebuildInProgress: true,
    rankPanelRetiredMessageIds:
      retiredMessageIds.length > 0 ? retiredMessageIds : undefined,
  }));
}

/**
 * Persiste los IDs retirados que no se pudieron borrar.
 *
 * @param guildId - ID del guild.
 * @param retiredMessageIds - IDs pendientes de borrado.
 * @throws {Error} Si el estado no es legible o falla la escritura.
 */
export async function updateRankPanelRetiredIds(
  guildId: string,
  retiredMessageIds: string[]
): Promise<void> {
  await updateRolesState(guildId, () => ({
    rankPanelRetiredMessageIds:
      retiredMessageIds.length > 0 ? retiredMessageIds : undefined,
  }));
}

/**
 * Limpia la marca de rebuild y los IDs retirados cuando la limpieza terminó.
 *
 * @param guildId - ID del guild.
 * @throws {Error} Si el estado no es legible o falla la escritura.
 */
export async function clearRankPanelJournal(
  guildId: string
): Promise<void> {
  await updateRolesState(guildId, () => ({
    rankPanelRebuildInProgress: undefined,
    rankPanelRetiredMessageIds: undefined,
  }));
}

/**
 * Indica si el estado ya apunta a un panel completo que no está en la lista de
 * retirados.
 *
 * Distingue un rebuild interrumpido antes de persistir los IDs nuevos de uno
 * que ya confirmó el panel nuevo y solo debe limpiar los mensajes viejos.
 *
 * @param state - Estado persistido del panel.
 * @returns `true` si el panel activo está completo y no figura como retirado.
 */
function isPanelRebuildCommitted(state: RolesState): boolean {
  if (
    !state.rankPanelHeaderMessageId ||
    !state.rankPanelManagementMessageId
  ) {
    return false;
  }

  const activeIds = getActivePanelMessageIds(state);
  if (activeIds.size === 0) return false;

  const retiredIds = new Set(state.rankPanelRetiredMessageIds ?? []);
  for (const messageId of activeIds) {
    if (retiredIds.has(messageId)) return false;
  }

  return true;
}

/**
 * Indica si hay un journal de panel que requiere recuperación.
 *
 * @param state - Estado persistido del panel.
 * @returns `true` si hay un rebuild en curso o IDs retirados pendientes.
 */
export function hasPendingRankPanelRecovery(state: RolesState): boolean {
  return Boolean(
    state.rankPanelRebuildInProgress ||
      (state.rankPanelRetiredMessageIds?.length ?? 0) > 0
  );
}

/**
 * Recupera el journal del panel antes de un rebuild normal.
 *
 * Si el rebuild quedó interrumpido antes de persistir los IDs nuevos, pide un
 * rebuild. Si el panel nuevo ya está confirmado, borra los IDs retirados y
 * limpia el journal. Nunca borra un ID que pertenezca al panel activo.
 *
 * @param guild - Guild al que pertenece el panel.
 * @param channel - Canal del panel.
 * @param state - Estado persistido del panel.
 * @returns Si se requiere rebuild y los avisos de la limpieza.
 * @throws {Error} Si falla la escritura del journal.
 */
export async function recoverRankPanelState(
  guild: Guild,
  channel: TextChannel,
  state: RolesState
): Promise<RankPanelRecoveryResult> {
  if (state.rankPanelRebuildInProgress && !isPanelRebuildCommitted(state)) {
    return { rebuildRequired: true, warnings: [] };
  }

  const activeIds = getActivePanelMessageIds(state);
  const retiredIds = (state.rankPanelRetiredMessageIds ?? []).filter(
    (messageId) => !activeIds.has(messageId)
  );

  if (retiredIds.length === 0) {
    await clearRankPanelJournal(guild.id);
    return { rebuildRequired: false, warnings: [] };
  }

  const deletion = await deletePanelMessages(channel, retiredIds);
  if (deletion.failedIds.length > 0) {
    await updateRankPanelRetiredIds(guild.id, deletion.failedIds);
  } else {
    await clearRankPanelJournal(guild.id);
  }

  return { rebuildRequired: false, warnings: deletion.warnings };
}
