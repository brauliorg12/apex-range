import { EmbedBuilder, TextChannel } from 'discord.js';

/**
 * Crea un embed informativo que confirma la selección de un canal de control específico.
 * @param selectedChannel El canal de texto seleccionado como canal de control.
 */
export function createControlChannelSpecifiedEmbed(
  selectedChannel: TextChannel
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🤖 Canal de Control Especificado')
    .setDescription(
      'Este canal ha sido seleccionado como canal de control para Apex Range.'
    )
    .addFields(
      { name: 'Estado:', value: '✅ Usando canal especificado', inline: false },
      { name: 'Nombre:', value: `#${selectedChannel.name}`, inline: false },
      { name: 'Permisos:', value: 'Verificados', inline: false }
    )
    .setFooter({
      text: 'El bot usará este canal para operaciones internas y logs.',
    })
    .setColor(0x00ff00); // Verde para éxito
}

/**
 * Crea un embed informativo que informa sobre la detección de un canal de control existente.
 * @param existingChannel El canal de texto existente configurado como canal de control.
 */
export function createControlChannelDetectedEmbed(
  existingChannel: TextChannel
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🤖 Canal de Control Detectado')
    .setDescription(
      'Este canal ha sido configurado como canal de control para Apex Range.'
    )
    .addFields(
      { name: 'Estado:', value: '✅ Usando canal existente', inline: false },
      { name: 'Nombre:', value: `#${existingChannel.name}`, inline: false },
      { name: 'Permisos:', value: 'Verificados', inline: false }
    )
    .setFooter({
      text: 'El bot usará este canal para operaciones internas y logs.',
    })
    .setColor(0x00ff00); // Verde para éxito
}

/**
 * Crea un embed de bienvenida para un nuevo canal de control creado.
 * @param controlChannel El nuevo canal de texto creado como canal de control.
 */
export function createControlChannelCreatedEmbed(
  controlChannel: TextChannel
): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🤖 Canal de Control Creado')
    .setDescription('¡Bienvenido al canal de control de Apex Range!')
    .addFields(
      { name: 'Nombre:', value: `#${controlChannel.name}`, inline: false },
      {
        name: 'Funciones:',
        value:
          '- 📋 Centro de logs y operaciones internas\n- 🔧 Comando de administración del bot\n- ⚠️ Notificaciones de errores y estado\n- 🔒 Acceso restringido a admins y bot',
        inline: false,
      }
    )
    .setFooter({
      text: 'Nota: Este canal es invisible para miembros normales y esencial para el funcionamiento del bot.',
    })
    .setColor(0x0099ff); // Azul para información
}
