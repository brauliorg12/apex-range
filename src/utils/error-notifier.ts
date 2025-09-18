import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { logApp } from './logger';

/**
 * Notifica errores relacionados con la actualización del embed de Apex Legends.
 * Envía un embed informativo al owner del servidor vía DM cuando ocurre un error.
 *
 * @param guild - El guild donde ocurrió el error.
 * @param channel - El canal donde ocurrió el error (para contexto).
 * @param errorType - El tipo de error ('missing_permissions', 'message_not_found', etc.).
 * @param details - Detalles adicionales del error (opcional).
 */
export async function notifyApexUpdateError(
  guild: Guild,
  channel: TextChannel,
  errorType: 'missing_permissions' | 'message_not_found' | 'unknown',
  details?: string
): Promise<void> {
  let title: string;
  let description: string;
  let color: number;

  switch (errorType) {
    case 'missing_permissions':
      title = '⚠️ Error de Actualización de Apex';
      description =
        `No pude actualizar el embed de estado de Apex Legends en el canal **#${channel.name}**.\n\n` +
        'Verifica que el bot tenga permisos para **Gestionar Mensajes** en ese canal.\n\n' +
        'Si el problema persiste, ejecuta `/apex-status` de nuevo para resetear.';
      color = 0xff0000; // Rojo
      break;
    case 'message_not_found':
      title = '⚠️ Mensaje de Apex No Encontrado';
      description =
        `El mensaje de estado de Apex Legends en el canal **#${channel.name}** no fue encontrado. Puede haber sido eliminado.\n\n` +
        'Ejecuta `/apex-status` de nuevo para crear uno nuevo.';
      color = 0xffa500; // Naranja
      break;
    case 'unknown':
    default:
      title = '⚠️ Error Desconocido en Apex';
      description =
        `Ocurrió un error inesperado al actualizar el estado de Apex Legends en el canal **#${
          channel.name
        }**: ${details || 'Sin detalles'}.\n\n` +
        'Revisa los logs del bot o contacta al desarrollador.';
      color = 0xff0000; // Rojo
      break;
  }

  const errorEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: `Servidor: ${guild.name} (${guild.id}) | Canal: #${channel.name}`,
    });

  try {
    // TODO revisar si el bot puede enviar DMs al owner
    // Enviar DM al owner del servidor
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [errorEmbed] });
    logApp(
      `Notificación de error enviada por DM al owner ${owner.user.tag} del guild ${guild.name}`
    );
  } catch (sendError) {
    logApp(
      `No pude enviar la notificación de error por DM al owner del guild ${guild.name}: ${sendError}`
    );
    // Fallback: intentar enviar al canal si es posible
    try {
      await channel.send({ embeds: [errorEmbed] });
      logApp(
        `Notificación de error enviada al canal ${channel.name} como fallback en guild ${guild.name}`
      );
    } catch (fallbackError) {
      logApp(`Fallback también falló en guild ${guild.name}: ${fallbackError}`);
    }
  }
}
