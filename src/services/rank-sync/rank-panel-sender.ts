import { Message, TextChannel } from 'discord.js';
import { deletePanelMessages } from './rank-panel-deletion';
import { RankPanelMessageIds, RankPanelPayload } from './rank-panel-types';

/**
 * Envía header, cards y panel de gestión.
 * Si falla un envío, elimina los mensajes ya enviados en este intento.
 *
 * @param channel - Canal donde se publica el panel.
 * @param panel - Panel completo construido en memoria.
 * @returns Los IDs de los mensajes enviados.
 * @throws {Error} El error original del envío que falló.
 */
export async function sendRankPanelMessages(
  channel: TextChannel,
  panel: RankPanelPayload
): Promise<RankPanelMessageIds> {
  const sent: Message[] = [];

  try {
    const header = await channel.send({ embeds: [panel.header] });
    sent.push(header);

    const cardMessageIds: Record<string, string> = {};

    for (const card of panel.cards) {
      card.embed.setTitle(null);
      const message = await channel.send({
        embeds: [card.embed],
        files: card.file ? [card.file] : [],
        components: card.components,
      });
      sent.push(message);
      cardMessageIds[card.rank.shortId] = message.id;
    }

    const management = await channel.send({
      embeds: [panel.management.embed],
      components: panel.management.components,
    });
    sent.push(management);

    return {
      headerMessageId: header.id,
      cardMessageIds,
      managementMessageId: management.id,
    };
  } catch (error) {
    await deletePanelMessages(
      channel,
      sent.map((message) => message.id)
    );
    throw error;
  }
}
