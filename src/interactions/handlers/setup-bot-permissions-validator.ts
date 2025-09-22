import { ButtonInteraction, TextChannel, EmbedBuilder } from 'discord.js';
import { verifyBotPermissionsForButton } from '../../helpers/button-verifications';

/**
 * Valida los permisos del bot en los canales requeridos.
 * @param interaction La interacción del botón
 * @param mode Modo de configuración
 * @param textChannel Canal actual
 * @param controlChannel Canal de control para modo existente
 * @param panelChannel Canal de panel para modo existente
 * @param logger Logger del servidor
 * @returns true si tiene permisos, false si no
 */
export async function validateBotPermissions(
  interaction: ButtonInteraction,
  mode: string,
  textChannel: TextChannel,
  controlChannel: TextChannel | undefined,
  panelChannel: TextChannel | undefined,
  logger: any
): Promise<boolean> {
  if (mode === 'existente' && (!controlChannel || !panelChannel)) {
    logger.error('Canales no definidos para modo existente');
    await interaction.followUp({
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Error')
          .setDescription('Error interno: canales no disponibles')
          .setColor(0xff0000),
      ],
      components: [],
      ephemeral: true,
    });
    return false;
  }

  const channelsToCheck =
    mode === 'existente' ? [controlChannel!, panelChannel!] : [textChannel];

  logger.info(
    `Verificando permisos del bot en ${channelsToCheck.length} canales`
  );

  const botMember = interaction.guild?.members.me;
  if (!botMember) {
    logger.error('Bot member not found in guild');
    return false;
  }

  for (const ch of channelsToCheck) {
    logger.info(`Verificando permisos en #${ch.name}`);
    if (!(await verifyBotPermissionsForButton(interaction, ch, logger))) {
      logger.info(`Faltan permisos del bot en #${ch.name}`);
      return false;
    }
  }
  logger.info('Permisos del bot verificados correctamente');
  return true;
}
