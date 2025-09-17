import { ButtonInteraction } from 'discord.js';
import { handleCreateMissingRoles } from './create-missing-roles';

/**
 * Handler para saltar mapeos y proceder por defecto.
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleSkipMappings(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'skip_mappings')
    return;

  await interaction.update({
    content: '⏭️ Mapeos saltados. Procediendo con nombres por defecto.',
    embeds: [],
    components: [],
  });

  // Simular clic en crear roles
  await handleCreateMissingRoles(interaction);
}
