import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

/**
 * Crea el embed y el botón para la confirmación del setup
 * @param guildName El nombre del servidor
 * @returns El embed y los componentes para el mensaje de confirmación
 */
export function createSetupConfirmationMessage(guildName: string) {
  const confirmEmbed = new EmbedBuilder()
    .setTitle('🔧 Confirmación de Setup')
    .setDescription(
      'Todas las verificaciones han pasado correctamente.\n\n' +
        'Haz clic en **Continuar Setup** para proceder con la configuración completa.\n\n' +
        'Esto creará los paneles de selección de rangos y estadísticas en este canal.'
    )
    .setColor(0x00ff00)
    .setFooter({
      text: `Servidor: ${guildName}`,
    });

  const continueButton = new ButtonBuilder()
    .setCustomId('continue_setup')
    .setLabel('Continuar Setup')
    .setStyle(ButtonStyle.Success)
    .setEmoji('✅');

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    continueButton
  );

  return { embeds: [confirmEmbed], components: [row] };
}
