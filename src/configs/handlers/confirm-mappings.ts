import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { saveServerConfig } from '../../utils/server-config';
import { suggestRoleMappings } from '../../helpers/suggest-role-mapping';
import { validateServerRoleMappings } from '../../utils/role-resolver';

/**
 * Handler para confirmar mapeos sugeridos.
 * Valida que los roles mapeados existan y notifica al usuario de problemas.
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
    saveServerConfig(interaction.guild!.id, {
      ranks: suggestions,
      excludedRoles: [],
    });

    // Validar que los mapeos funcionen correctamente
    const validation = validateServerRoleMappings(interaction.guild!);

    if (!validation.valid) {
      const warningEmbed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('⚠️ Advertencia: Algunos Roles No Existen')
        .setDescription(
          `Los siguientes roles mapeados no se encuentran en Discord:\n\n` +
            (validation.missingRanks.length > 0
              ? `**Rangos faltantes:** ${validation.missingRanks.join(', ')}\n`
              : '') +
            (validation.missingPlatforms.length > 0
              ? `**Plataformas faltantes:** ${validation.missingPlatforms.join(
                  ', '
                )}`
              : '') +
            `\n\n✅ Los mapeos han sido guardados.\n` +
            `📝 Continuaremos con la creación de roles faltantes.`
        );

      await interaction.editReply({
        embeds: [warningEmbed],
        components: [],
      });

      // Esperar 3 segundos para que el usuario lea el mensaje
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle('✅ Mapeos Confirmados y Aplicados')
      .setDescription(
        validation.valid
          ? 'Los mapeos de roles han sido guardados y validados exitosamente. Ahora continuando con la creación de roles faltantes.'
          : 'Los mapeos de roles han sido guardados. Continuando con la creación de roles faltantes.'
      );

    const continueButton = new ButtonBuilder()
      .setCustomId('proceed_create_roles')
      .setLabel('Crear Roles Faltantes')
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
