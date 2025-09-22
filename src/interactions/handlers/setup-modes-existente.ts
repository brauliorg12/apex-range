import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

/**
 * Maneja la selección del modo de canales existentes para el bot de Apex Legends.
 *
 * Esta función presenta una interfaz para seleccionar canales existentes en el servidor.
 * Muestra un menú select con todos los canales de texto disponibles, permitiendo al usuario
 * seleccionar dos canales: uno para administración y otro para el panel de rangos.
 *
 * El usuario debe seleccionar exactamente dos canales en orden: primero el canal de administración,
 * luego el canal del panel. Después de la selección, se mostrará una confirmación.
 *
 * @param interaction - La interacción de botón que activó la selección del modo existente
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleModoExistente(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  // Obtener canales de texto del servidor
  const textChannels = interaction
    .guild!.channels.cache.filter((ch) => ch.type === 0) // ChannelType.GuildText
    .sort((a, b) => a.name.localeCompare(b.name));

  if (textChannels.size < 2) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error - Canales Insuficientes')
      .setDescription(
        'Tu servidor necesita al menos 2 canales de texto para usar el modo de canales existentes.\n\n' +
          'Considera crear más canales o usar el modo automático.'
      )
      .setColor(0xff0000);

    const backButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('back_to_modes')
        .setLabel('Volver')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('cancel_setup')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [backButtons],
    });
    return;
  }

  // Crear opciones para el select menu
  const channelOptions = textChannels.map((ch) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`#${ch.name}`)
      .setValue(ch.id)
      .setDescription(`ID: ${ch.id}`)
  );

  // Crear el select menu
  const channelSelect = new StringSelectMenuBuilder()
    .setCustomId('select_channels_existente')
    .setPlaceholder('Selecciona canal admin y canal panel (en orden)')
    .setMinValues(2)
    .setMaxValues(2)
    .addOptions(channelOptions);

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      channelSelect
    );

  const existenteEmbed = new EmbedBuilder()
    .setTitle('📎 Modo Canales Existentes - Selección')
    .setDescription(
      'Selecciona **dos canales** de la lista:\n\n' +
        '1. **Primer canal**: Canal de administración (solo para administradores)\n' +
        '2. **Segundo canal**: Canal del panel de rangos (visible para todos)\n\n' +
        '**Importante:** Selecciona los canales en el orden correcto.'
    )
    .setColor(0xffa500)
    .addFields(
      {
        name: '📋 Instrucciones',
        value:
          '• Elige exactamente 2 canales\n' +
          '• Orden: Admin primero, Panel segundo\n' +
          '• Los canales deben ser diferentes',
        inline: false,
      },
      {
        name: '⚠️ Notas',
        value:
          '• El bot configurará permisos automáticamente\n' +
          '• El canal admin será privado para administradores\n' +
          '• El panel será público para todos los usuarios',
        inline: false,
      }
    );

  const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_to_modes')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId('cancel_setup')
      .setLabel('Cancelar')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('❌')
  );

  await interaction.editReply({
    embeds: [existenteEmbed],
    components: [selectRow, buttons],
  });
}
