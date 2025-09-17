import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { saveServerConfig } from '../../utils/server-config';
import { suggestRoleMappings } from '../../helpers/suggest-role-mapping';

/**
 * Handler para confirmar mapeos sugeridos.
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleConfirmMappings(interaction: ButtonInteraction) {
  if (!interaction.isButton() || interaction.customId !== 'confirm_mappings')
    return;

  await interaction.deferUpdate();

  try {
    const existingRoles = interaction.guild!.roles.cache.map(
      (role) => role.name
    );
    const suggestions = suggestRoleMappings(
      interaction.guild!.id,
      existingRoles
    );

    // Guardar sugerencias en configuración
    saveServerConfig(interaction.guild!.id, suggestions);

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Mapeos Confirmados')
      .setDescription(
        'Los mapeos de roles han sido guardados. Ahora continuando con la creación de roles faltantes.'
      );

    const continueButton = new ButtonBuilder()
      .setCustomId('proceed_create_roles')
      .setLabel('Continuar Creando Roles')
      .setStyle(ButtonStyle.Success)
      .setEmoji('▶️');

    const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
      continueButton
    );

    await interaction.editReply({
      embeds: [embed],
      components: [components],
    });
  } catch (error) {
    console.error('Error confirmando mapeos:', error);
    await interaction.editReply({
      content: '❌ Error al confirmar mapeos.',
      embeds: [],
      components: [],
    });
  }
}
