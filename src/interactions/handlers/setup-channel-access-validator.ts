import { ButtonInteraction, TextChannel } from 'discord.js';
import { verifyChannelAccessForButton } from '../../helpers/button-verifications';

/**
 * Valida el acceso al canal actual para modos que lo requieren.
 * @param interaction La interacción del botón
 * @param mode Modo de configuración
 * @param logger Logger del servidor
 * @returns El canal de texto si es válido, null si hay error
 */
export async function validateChannelAccess(
  interaction: ButtonInteraction,
  mode: string,
  logger: any
): Promise<TextChannel | null> {
  const channel = interaction.channel;
  if (!channel || !('name' in channel) || channel.type !== 0) {
    logger.error(
      'No se pudo identificar el canal actual o no es un canal de texto'
    );
    return null;
  }

  const textChannel = channel as TextChannel;
  logger.info(`Canal identificado: ${textChannel.name} (${textChannel.id})`);

  // Para modo existente, no necesitamos verificar acceso al canal actual
  if (mode !== 'existente') {
    if (
      !(await verifyChannelAccessForButton(interaction, textChannel, logger))
    ) {
      logger.info('Falta acceso al canal');
      return null;
    }
    logger.info('Acceso al canal verificado');
  }

  return textChannel;
}
