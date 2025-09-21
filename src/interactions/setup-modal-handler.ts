import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

/**
 * Maneja la respuesta del modal de configuración manual para el bot de Apex Legends.
 *
 * Esta función procesa la entrada del usuario desde un modal de Discord que permite
 * especificar nombres personalizados para los canales de administración y panel de rangos.
 * Realiza una validación exhaustiva de los nombres proporcionados y presenta una interfaz
 * de confirmación antes de proceder con la creación de canales.
 *
 * El proceso incluye:
 * - Extracción y normalización de los nombres de canales del modal
 * - Validación de formato (solo letras minúsculas, números y guiones)
 * - Verificación de unicidad de nombres en el servidor
 * - Prevención de nombres duplicados entre canales
 * - Presentación de errores detallados con opciones de corrección
 * - Interfaz de confirmación con vista previa de la configuración
 *
 * @param interaction - La interacción de envío del modal que contiene los nombres de canales
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleManualSetupModal(
  interaction: ModalSubmitInteraction
) {
  await interaction.deferUpdate();

  // Obtener los valores del modal
  const adminChannelName = interaction.fields
    .getTextInputValue('admin_channel_name')
    .toLowerCase();
  const panelChannelName = interaction.fields
    .getTextInputValue('panel_channel_name')
    .toLowerCase();

  // Validar nombres de canales
  const nameRegex = /^[a-z0-9_-]+$/;
  const errors: string[] = [];

  if (!nameRegex.test(adminChannelName)) {
    errors.push(
      '• El nombre del canal de administración contiene caracteres inválidos'
    );
  }

  if (!nameRegex.test(panelChannelName)) {
    errors.push(
      '• El nombre del canal del panel contiene caracteres inválidos'
    );
  }

  if (adminChannelName === panelChannelName) {
    errors.push('• Los nombres de los canales no pueden ser iguales');
  }

  // Verificar si ya existen canales con esos nombres
  const existingAdminChannel = interaction.guild?.channels.cache.find(
    (ch) => ch.name.toLowerCase() === adminChannelName && ch.type === 0
  );
  const existingPanelChannel = interaction.guild?.channels.cache.find(
    (ch) => ch.name.toLowerCase() === panelChannelName && ch.type === 0
  );

  if (existingAdminChannel) {
    errors.push(`• Ya existe un canal llamado "${adminChannelName}"`);
  }

  if (existingPanelChannel) {
    errors.push(`• Ya existe un canal llamado "${panelChannelName}"`);
  }

  // Si hay errores, mostrarlos
  if (errors.length > 0) {
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Error en la Configuración')
      .setDescription(
        'Se encontraron los siguientes errores:\n\n' +
          errors.join('\n') +
          '\n\n' +
          '**Requisitos:**\n' +
          '• Solo letras minúsculas, números y guiones bajos\n' +
          '• Entre 3-32 caracteres\n' +
          '• Nombres únicos en el servidor'
      )
      .setColor(0xff0000);

    const retryButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('back_to_modes')
        .setLabel('Volver')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('modo_manual')
        .setLabel('Reintentar')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔄'),
      new ButtonBuilder()
        .setCustomId('cancel_setup')
        .setLabel('Cancelar')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❌')
    );

    await interaction.editReply({
      embeds: [errorEmbed],
      components: [retryButtons],
    });
    return;
  }

  // Si no hay errores, mostrar confirmación
  const confirmEmbed = new EmbedBuilder()
    .setTitle('⚙️ Configuración Manual - Confirmación')
    .setDescription(
      'Has especificado los siguientes nombres para los canales:\n\n' +
        `**Canal de Administración:** \`#${adminChannelName}\`\n` +
        `**Canal del Panel:** \`#${panelChannelName}\`\n\n` +
        '¿Deseas crear los canales con estos nombres?'
    )
    .setColor(0x0099ff)
    .addFields(
      {
        name: '📝 Nombres Elegidos',
        value:
          `• \`#${adminChannelName}\` - Para administración del bot\n` +
          `• \`#${panelChannelName}\` - Para el panel de rangos`,
        inline: false,
      },
      {
        name: '⚠️ Importante',
        value:
          '• Los canales se crearán con permisos restringidos\n' +
          '• Solo administradores podrán ver el canal de administración\n' +
          '• El panel será visible para todos los usuarios',
        inline: false,
      }
    );

  const confirmButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_to_modes')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId(`confirm_manual_${adminChannelName}_${panelChannelName}`)
      .setLabel('Crear Canales')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId('modo_manual')
      .setLabel('Cambiar Nombres')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
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
