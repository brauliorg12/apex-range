import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getApexRanksForGuild } from '../../helpers/get-apex-ranks-for-guild';

/**
 * Handler para mostrar instrucciones manuales
 * @param interaction La interacción del botón que activó este handler
 * @returns Promise<void> No retorna valor, maneja la interacción directamente
 */
export async function handleShowManualInstructions(
  interaction: ButtonInteraction
) {
  if (
    !interaction.isButton() ||
    interaction.customId !== 'show_manual_instructions'
  )
    return;

  const ranks = getApexRanksForGuild(interaction.guild!.id, interaction.guild!);
  const embed = new EmbedBuilder()
    .setColor('#3498db')
    .setTitle('📋 Instrucciones Manuales')
    .setDescription(
      'Para crear los roles manualmente:\n\n' +
        '1. Ve a **Configuración del Servidor** → **Roles**\n' +
        '2. Haz click en **"Crear Rol"**\n' +
        '3. Crea los siguientes roles con estos nombres exactos:\n\n' +
        ranks.map((r) => `• **${r.roleName}**`).join('\n') +
        '\n\n' +
        '4. Una vez creados todos los roles, ejecuta nuevamente `/setup-roles`'
    );

  const continueButton = new ButtonBuilder()
    .setCustomId('continue_setup')
    .setLabel('Entendido')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('✅');

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(continueButton),
  ];

  await interaction.update({
    embeds: [embed],
    components,
  });
}
