import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

/**
 * Maneja la selección del modo de canales existentes para el bot de Apex Legends.
 *
 * Esta función presenta información sobre el modo de configuración que utiliza
 * canales ya existentes en el servidor en lugar de crear nuevos. Explica al usuario
 * cómo debe proporcionar los canales requeridos mediante parámetros del comando
 * slash y ofrece opciones para confirmar la selección o regresar al menú anterior.
 *
 * Parámetros requeridos para este modo (especificados en comando slash):
 * - `canal_admin_existente`: Canal de administración ya existente en el servidor
 * - `canal_publico_existente`: Canal del panel ya existente en el servidor
 *
 * Ejemplo de uso del comando slash:
 * `/setup-roles modo:existente canal_admin_existente:#admin canal_publico_existente:#rangos`
 *
 * @param interaction - La interacción de botón que activó la selección del modo existente
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleModoExistente(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const existenteEmbed = new EmbedBuilder()
    .setTitle('📎 Modo Canales Existentes Seleccionado')
    .setDescription(
      'Necesitas seleccionar los canales existentes:\n\n' +
        '**Opciones requeridas:**\n' +
        '• `canal_admin_existente`: Canal de administración existente\n' +
        '• `canal_publico_existente`: Canal del panel existente\n\n' +
        '**Ejemplo:**\n' +
        '`/setup-roles modo:existente canal_admin_existente:#admin canal_publico_existente:#rangos`'
    )
    .setColor(0xffa500);

  const existenteButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_to_modes')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId('confirm_existente')
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
    embeds: [existenteEmbed],
    components: [existenteButtons],
  });
}
