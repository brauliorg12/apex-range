import { Guild, TextChannel } from 'discord.js';
import {
  buildRankPanel,
  persistRankPanelState,
  sendRankPanelMessages,
} from '../services/rank-sync/rank-panel';
import { forgetRankCardFingerprints } from '../helpers/rank-card-fingerprint';

/**
 * Envía el panel de rangos con header, cards y panel de gestión.
 * Se usa durante el setup completo.
 *
 * @param channel - Canal donde se publica el panel.
 * @param guild - Guild al que pertenece el panel.
 * @throws {Error} Si falla la construcción, el envío o la persistencia.
 */
export async function sendOnlinePanel(
  channel: TextChannel,
  guild: Guild
): Promise<void> {
  const panel = await buildRankPanel(guild);
  const messageIds = await sendRankPanelMessages(channel, panel);
  await persistRankPanelState(guild, channel.id, messageIds);
  forgetRankCardFingerprints(guild.id);
}
