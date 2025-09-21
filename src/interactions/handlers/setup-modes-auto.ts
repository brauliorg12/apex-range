import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

/**
 * Maneja la selección del modo automático de configuración para el bot de Apex Legends.
 *
 * Esta función presenta una interfaz de confirmación cuando el usuario selecciona
 * el modo automático de configuración. Muestra información clara sobre los canales
 * que se crearán con nombres predeterminados y ofrece opciones para confirmar,
 * volver al menú anterior o cancelar el proceso de configuración.
 *
 * Canales que se crearán automáticamente:
 * - `#apex-range-admin`: Canal de administración con permisos restringidos
 * - `#apex-rangos`: Canal público del panel de rangos interactivo
 *
 * @param interaction - La interacción de botón que activó la selección del modo automático
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleModoAuto(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const confirmEmbed = new EmbedBuilder()
    .setTitle('🔄 Modo Automático Seleccionado')
    .setDescription(
      'Se crearán los canales automáticamente con nombres predeterminados:\n\n' +
        '• `#apex-range-admin` (Canal de administración)\n' +
        '• `#apex-rangos` (Canal del panel)\n\n' +
        '¿Deseas continuar con esta configuración?'
    )
    .setColor(0x00ff00);

  const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_to_modes')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId('confirm_auto')
      .setLabel('Continuar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId('cancel_setup')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );

  await interaction.editReply({
    embeds: [confirmEmbed],
    components: [confirmButtons],
  });
}
