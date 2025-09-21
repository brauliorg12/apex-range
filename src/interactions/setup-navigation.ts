import {
  ButtonInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

/**
 * Crea el embed y botones para el menú principal de selección de modos.
 *
 * @param guildName - Nombre del servidor para mostrar en el footer
 * @returns Objeto con embed y componentes para el menú principal
 */
export function createMainMenuEmbed(guildName: string) {
  const modeEmbed = new EmbedBuilder()
    .setTitle('🎛️ Selecciona el Modo de Configuración')
    .setDescription(
      'Elige cómo quieres configurar los canales para el bot de Apex Legends:\n\n' +
        '**🔄 Automático**\n' +
        '• Crea canales automáticamente con nombres predeterminados\n' +
        '• `#apex-range-admin` y `#apex-rangos`\n' +
        '• Ideal para configuración rápida\n\n' +
        '**⚙️ Manual**\n' +
        '• Especifica nombres personalizados para nuevos canales\n' +
        '• Control total sobre los nombres\n' +
        '• Perfecto para personalización\n\n' +
        '**📎 Usar Canales Existentes**\n' +
        '• Utiliza canales ya creados en tu servidor\n' +
        '• No crea nuevos canales\n' +
        '• Ideal para servidores organizados'
    )
    .setColor(0x00ff00)
    .setFooter({
      text: `Servidor: ${guildName}`,
    });

  const modeButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('modo_auto')
      .setLabel('Automático')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('modo_manual')
      .setLabel('Manual')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('⚙️'),
    new ButtonBuilder()
      .setCustomId('modo_existente')
      .setLabel('Canales Existentes')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📎')
  );

  return { embeds: [modeEmbed], components: [modeButtons] };
}

/**
 * Maneja la navegación de vuelta al menú principal de selección de modos de configuración.
 *
 * Esta función proporciona navegación fluida dentro del flujo de configuración del bot
 * de Apex Legends, permitiendo a los usuarios regresar al menú principal de selección
 * de modos desde cualquier punto del proceso de configuración. Restaura exactamente
 * la misma interfaz inicial que presenta las tres opciones principales de configuración
 * con el mismo formato, colores y contenido detallado.
 *
 * Modos de configuración presentados:
 * - **Automático**: Creación automática de canales con nombres predeterminados
 * - **Manual**: Configuración personalizada con nombres de canales especificados por el usuario
 * - **Canales Existentes**: Utilización de canales ya creados en el servidor
 *
 * Esta función es crucial para mantener una experiencia de usuario intuitiva y consistente,
 * permitiendo navegación bidireccional dentro del flujo de configuración sin cambios visuales.
 *
 * @param interaction - La interacción de botón que activó el regreso al menú principal
 * @returns Promise<void> - No retorna valor, actualiza la interfaz directamente
 */
export async function handleBackToModes(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const menuData = createMainMenuEmbed(
    interaction.guild?.name || 'Desconocido'
  );

  await interaction.editReply(menuData);
}

/**
 * Maneja la cancelación del setup
 */
export async function handleCancelSetup(interaction: ButtonInteraction) {
  await interaction.deferUpdate();

  const cancelEmbed = new EmbedBuilder()
    .setTitle('❌ Configuración Cancelada')
    .setDescription(
      'La configuración ha sido cancelada. Puedes ejecutar `/setup-roles` nuevamente cuando estés listo.'
    )
    .setColor(0xff0000);

  await interaction.editReply({
    embeds: [cancelEmbed],
    components: [],
  });
}
