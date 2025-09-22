import { EmbedBuilder, TextChannel } from 'discord.js';

/**
 * Crea un embed informativo que confirma la selección de un canal del panel específico.
 * @param selectedChannel El canal de texto seleccionado como canal del panel.
 */
export function createPanelChannelSpecifiedEmbed(
  selectedChannel: TextChannel
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 Canal del Panel Especificado')
    .setDescription(
      'Este canal ha sido seleccionado como canal del panel para Apex Range.'
    )
    .addFields(
      { name: 'Estado', value: '✅ Usando canal especificado', inline: false },
      { name: 'Nombre', value: `#${selectedChannel.name}`, inline: false },
      { name: 'Tipo', value: 'Panel de rangos público', inline: false }
    )
    .setFooter({
      text: 'El bot colocará aquí el panel de selección de rangos y estadísticas.',
    })
    .setColor(0x00ff00); // Verde para éxito
}

/**
 * Crea un embed informativo que informa sobre la detección de un canal del panel existente.
 * @param existingChannel El canal de texto existente configurado como canal del panel.
 */
export function createPanelChannelDetectedEmbed(
  existingChannel: TextChannel
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎮 Canal del Panel Detectado')
    .setDescription(
      'Este canal ha sido configurado como canal del panel para Apex Range.'
    )
    .addFields(
      { name: 'Estado', value: '✅ Usando canal existente', inline: false },
      { name: 'Nombre', value: `#${existingChannel.name}`, inline: false },
      { name: 'Tipo', value: 'Panel de rangos público', inline: false }
    )
    .setFooter({
      text: 'El bot colocará aquí el panel de selección de rangos y estadísticas.',
    })
    .setColor(0x00ff00); // Verde para éxito
}
