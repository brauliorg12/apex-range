import { ButtonInteraction, TextChannel } from 'discord.js';

/**
 * Extrae y valida los canales seleccionados para el modo existente.
 * @param interaction La interacción del botón
 * @param logger Logger del servidor
 * @returns Objeto con los canales extraídos o null si hay error
 */
export async function extractChannelsForExistingMode(
  interaction: ButtonInteraction,
  logger: any
): Promise<{ controlChannel: TextChannel; panelChannel: TextChannel } | null> {
  const parts = interaction.customId.split('_');
  if (parts.length < 4) {
    logger.error('CustomId malformado para modo existente');
    return null;
  }

  const controlChannelId = parts[2];
  const panelChannelId = parts[3];
  const controlCh = interaction.guild!.channels.cache.get(controlChannelId);
  const panelCh = interaction.guild!.channels.cache.get(panelChannelId);

  if (!controlCh || !panelCh || controlCh.type !== 0 || panelCh.type !== 0) {
    logger.error('Canales no encontrados o no son canales de texto');
    return null;
  }

  const controlChannel = controlCh as TextChannel;
  const panelChannel = panelCh as TextChannel;

  logger.info(
    `Canales extraídos - Control: #${controlChannel.name}, Panel: #${panelChannel.name}`
  );
  return { controlChannel, panelChannel };
}
