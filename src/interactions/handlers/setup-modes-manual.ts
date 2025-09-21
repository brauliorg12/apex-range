import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { getServerLogger } from '../../utils/server-logger';

/**
 * Maneja la selección del modo manual de configuración para el bot de Apex Legends.
 *
 * Esta función presenta información educativa y preparatoria cuando el usuario selecciona
 * el modo manual de configuración. Muestra las reglas detalladas para nombrar canales,
 * ejemplos válidos y prepara la transición hacia el formulario modal donde el usuario
 * podrá especificar los nombres personalizados de los canales.
 *
 * Reglas de validación que se explican al usuario:
 * - Longitud: 3-32 caracteres
 * - Caracteres permitidos: letras minúsculas, números y guiones bajos
 * - Unicidad: no pueden existir canales con el mismo nombre
 * - Conversión automática: los nombres se convierten a minúsculas
 *
 * @param interaction - La interacción de botón que activó la selección del modo manual
 * @returns Promise<void> - No retorna valor, maneja la respuesta directamente en la interacción
 */
export async function handleModoManual(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  // Mostrar información instructiva antes de abrir el modal
  const infoEmbed = new EmbedBuilder()
    .setTitle('⚙️ Configuración Manual de Canales')
    .setDescription(
      'A continuación se abrirá un formulario para que especifiques los nombres de los canales.\n\n' +
        '📝 **Reglas para los nombres:**\n' +
        '• Deben tener entre 3-32 caracteres\n' +
        '• Solo letras minúsculas, números y guiones bajos\n' +
        '• No pueden existir canales con el mismo nombre en el servidor\n' +
        '• Los nombres se convertirán automáticamente a minúsculas\n\n' +
        '**Ejemplos válidos:** `apex-admin`, `rangos-apex`, `admin_bot`'
    )
    .setColor(0x0099ff)
    .setFooter({
      text: 'Completa el formulario que se abrirá a continuación',
      iconURL: interaction.guild?.iconURL() || undefined,
    });

  const continueButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('back_to_modes')
      .setLabel('Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⬅️'),
    new ButtonBuilder()
      .setCustomId('open_manual_modal')
      .setLabel('Continuar al Formulario')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📝')
  );

  await interaction.editReply({
    embeds: [infoEmbed],
    components: [continueButton],
  });
}

/**
 * Abre el modal de configuración manual para el bot de Apex Legends.
 *
 * Esta función construye y presenta un formulario modal interactivo que permite
 * al usuario especificar nombres personalizados para los canales de administración
 * y panel de rangos. El modal incluye validaciones integradas en los campos
 * de entrada y maneja errores de manera robusta con logging detallado.
 *
 * Campos del modal:
 * - Canal de administración: Campo requerido con validaciones de longitud (3-32 caracteres)
 * - Canal del panel: Campo requerido con validaciones de longitud (3-32 caracteres)
 *
 * Características del modal:
 * - Validación integrada: Longitud mínima/máxima, campos requeridos
 * - Placeholders informativos con ejemplos de formato válido
 * - Logging detallado para debugging y monitoreo
 * - Manejo robusto de errores con respuestas de fallback
 *
 * @param interaction - La interacción de botón que activó la apertura del modal
 * @returns Promise<void> - No retorna valor, muestra el modal directamente al usuario
 *
 * @throws {Error} Registra errores internamente pero maneja fallos gracefully
 */
export async function handleOpenManualModal(interaction: ButtonInteraction) {
  // Crear logger específico para este servidor
  const logger = getServerLogger(
    interaction.guild?.id || 'unknown',
    interaction.guild?.name
  );

  try {
    logger.debug('Iniciando handleOpenManualModal');

    // Crear modal para configuración manual
    const manualModal = new ModalBuilder()
      .setCustomId('manual_setup_modal')
      .setTitle('⚙️ Configuración Manual de Canales');

    logger.debug('ModalBuilder creado');

    // Input para nombre del canal de administración
    const adminChannelInput = new TextInputBuilder()
      .setCustomId('admin_channel_name')
      .setLabel('Nombre del Canal de Administración')
      .setPlaceholder('apex-admin (solo minúsculas, números, guiones)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(32);

    logger.debug('adminChannelInput creado');

    // Input para nombre del canal del panel
    const panelChannelInput = new TextInputBuilder()
      .setCustomId('panel_channel_name')
      .setLabel('Nombre del Canal del Panel')
      .setPlaceholder('apex-rangos (solo minúsculas, números, guiones)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(32);

    logger.debug('panelChannelInput creado');

    // Crear filas para los inputs
    const adminRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      adminChannelInput
    );
    const panelRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      panelChannelInput
    );

    logger.debug('Filas creadas correctamente');

    // Agregar las filas al modal
    manualModal.addComponents(adminRow, panelRow);

    logger.debug('Componentes agregados al modal');

    // Mostrar el modal
    await interaction.showModal(manualModal);

    logger.debug('Modal mostrado exitosamente');
  } catch (error) {
    logger.error('ERROR en handleOpenManualModal:', error);
    logger.error(
      'Stack trace:',
      error instanceof Error ? error.stack : 'No stack trace available'
    );
    // Si hay un error, intentar responder con un mensaje de error
    if (!interaction.replied) {
      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content:
              'Ocurrió un error al abrir el formulario. Por favor intenta nuevamente.',
            embeds: [],
            components: [],
          });
        } else {
          await interaction.reply({
            content:
              'Ocurrió un error al abrir el formulario. Por favor intenta nuevamente.',
            ephemeral: true,
          });
        }
      } catch (replyError) {
        logger.error('Error al enviar mensaje de error:', replyError);
      }
    }
  }
}
