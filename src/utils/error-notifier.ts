import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { logApp } from './logger';

/**
 * Notifica errores relacionados con los embeds de setup-roles.
 * Envía un embed informativo al owner del servidor cuando ocurre un error con los mensajes de setup.
 *
 * @param guild - El guild donde ocurrió el error.
 * @param channel - El canal donde ocurrió el error (para contexto).
 * @param errorType - El tipo de error ('role_selection_deleted', 'stats_message_deleted', 'both_deleted', etc.).
 * @param details - Detalles adicionales del error (opcional).
 */
export async function notifySetupRolesError(
  guild: Guild,
  channel: TextChannel,
  errorType:
    | 'role_selection_deleted'
    | 'stats_message_deleted'
    | 'both_deleted'
    | 'unknown',
  details?: string
): Promise<void> {
  let title: string;
  let description: string;
  let color: number;

  switch (errorType) {
    case 'role_selection_deleted':
      title = '⚠️ Mensaje de Selección de Rango Eliminado';
      description =
        `El mensaje de **selección de rango** en el canal **#${channel.name}** ha sido eliminado.\n\n` +
        'Los usuarios ya no pueden seleccionar su rango desde este canal.\n\n' +
        '**Solución:** Ejecuta `/setup-roles` para recrear los mensajes.';
      color = 0xffa500; // Naranja
      break;
    case 'stats_message_deleted':
      title = '⚠️ Mensaje de Estadísticas Eliminado';
      description =
        `El mensaje de **estadísticas de jugadores** en el canal **#${channel.name}** ha sido eliminado.\n\n` +
        'Las estadísticas automáticas ya no se muestran en este canal.\n\n' +
        '**Solución:** Ejecuta `/setup-roles` para recrear los mensajes.';
      color = 0xffa500; // Naranja
      break;
    case 'both_deleted':
      title = '⚠️ Mensajes de Setup-Roles Eliminados';
      description =
        `Los mensajes de **selección de rango y estadísticas** en el canal **#${channel.name}** han sido eliminados.\n\n` +
        'La funcionalidad completa del bot en este canal se ha perdido.\n\n' +
        '**Solución:** Ejecuta `/setup-roles` para restaurar todo.';
      color = 0xff0000; // Rojo
      break;
    case 'unknown':
    default:
      title = '⚠️ Error en Setup-Roles';
      description =
        `Ocurrió un error inesperado con los mensajes de setup-roles en el canal **#${
          channel.name
        }**: ${details || 'Sin detalles'}.\n\n` +
        'Revisa la configuración del bot o ejecuta `/setup-roles` para resetear.';
      color = 0xff0000; // Rojo
      break;
  }

  const errorEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .addFields({
      name: '💡 Recuperación Rápida',
      value:
        'Ejecuta `/setup-roles` en cualquier canal para restaurar la funcionalidad completa.',
      inline: false,
    })
    .setFooter({
      text: `Servidor: ${guild.name} (${guild.id}) | Canal: #${channel.name}`,
    });

  try {
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [errorEmbed] });
    logApp(
      `Notificación de error de setup-roles enviada por DM al owner ${owner.user.tag} del guild ${guild.name}`
    );
  } catch (sendError) {
    logApp(
      `No pude enviar la notificación de error de setup-roles por DM al owner del guild ${guild.name}: ${sendError}`
    );
    // Fallback: intentar enviar al canal si es posible
    try {
      await channel.send({ embeds: [errorEmbed] });
      logApp(
        `Notificación de error de setup-roles enviada al canal ${channel.name} como fallback en guild ${guild.name}`
      );
    } catch (fallbackError) {
      logApp(`Fallback también falló en guild ${guild.name}: ${fallbackError}`);
    }
  }
}

/**
 * Notifica errores relacionados con la actualización del embed de Apex Legends.
 * Envía un embed informativo al owner del servidor vía DM cuando ocurre un error
 * durante la actualización automática del panel de estado de Apex Legends.
 *
 * @param guild - El guild donde ocurrió el error.
 * @param channel - El canal donde se encuentra el mensaje de Apex que falló al actualizarse.
 * @param errorType - El tipo específico de error ('missing_permissions', 'message_not_found', 'unknown').
 * @param details - Detalles técnicos adicionales del error para diagnóstico avanzado (opcional).
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
