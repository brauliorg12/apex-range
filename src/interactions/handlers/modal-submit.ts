import { ModalSubmitInteraction } from 'discord.js';
import { logInteraction } from '../../utils/logger';
import { handleModalInteraction } from '../../modal-interactions';

/**
 * Maneja interacciones de envío de modales
 * @param interaction La interacción del modal
 * @returns Promise<void>
 */
export async function handleModalSubmit(
  interaction: ModalSubmitInteraction
) {
  await logInteraction({
    type: 'ModalSubmit',
    userTag: interaction.user.tag,
    userId: interaction.user.id,
    guildName: interaction.guild!.name,
    guildId: interaction.guild!.id,
    customId: interaction.customId,
  });

  try {
    await handleModalInteraction(interaction);
  } catch (error) {
    console.error('[ERROR] Error al manejar el modal:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '¡Hubo un error al procesar tu solicitud!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '¡Hubo un error al procesar tu solicitud!',
        ephemeral: true,
      });
    }
  }
}
