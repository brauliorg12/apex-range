import { StringSelectMenuInteraction } from 'discord.js';
import { logInteraction } from '../../utils/logger';
import { handleSelectMenuInteraction } from './select-menu-interaction';

/**
 * Maneja interacciones de menús select de cadena
 * @param interaction La interacción del menú select
 * @returns Promise<void>
 */
export async function handleStringSelectMenu(
  interaction: StringSelectMenuInteraction
) {
  await logInteraction({
    type: 'StringSelectMenu',
    userTag: interaction.user.tag,
    userId: interaction.user.id,
    guildName: interaction.guild!.name,
    guildId: interaction.guild!.id,
    customId: interaction.customId,
    details: `Values: ${JSON.stringify(interaction.values)}`,
  });

  try {
    await handleSelectMenuInteraction(interaction);
  } catch (error) {
    console.error('[ERROR] Error al manejar el select:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: '¡Hubo un error al procesar tu selección!',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: '¡Hubo un error al procesar tu selección!',
        ephemeral: true,
      });
    }
  }
}
