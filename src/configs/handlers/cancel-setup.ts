import { ButtonInteraction } from 'discord.js';

/**
 * Handler para cancelar el setup
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleCancelSetup(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'cancel_setup')
    return;

  await interaction.update({
    content: '❌ Configuración cancelada.',
    embeds: [],
    components: [],
  });
}
