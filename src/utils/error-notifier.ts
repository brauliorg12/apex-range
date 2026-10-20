import { Guild, TextChannel, EmbedBuilder } from 'discord.js';
import { ApexNotifyType } from '../interfaces/apex-notify';
import { logApp } from './logger';
import { sendToControlChannel } from './control-channel-helper';

const SETUP_ALERT_COOLDOWN_MS = 60 * 60 * 1000;
const lastSetupAlertAt = new Map<string, number>();

/**
 * Limpia el cooldown de avisos de setup-roles de un guild.
 *
 * @param guildId - ID del guild que se removio.
 */
export function forgetSetupErrorNotifications(guildId: string): void {
  for (const key of lastSetupAlertAt.keys()) {
    if (key.startsWith(`${guildId}:`)) {
      lastSetupAlertAt.delete(key);
    }
  }
}

/**
 * Notifica errores relacionados con los embeds de setup-roles.
 * Intenta el canal de control del servidor y, si no existe, el DM del owner.
 * No envia tarjetas de error a canales publicos.
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
        `El mensaje de **selección de rango** en el canal <#${channel.id}> ha sido eliminado.\n\n` +
        'Los usuarios ya no pueden seleccionar su rango desde este canal.\n\n' +
        '**Solución:** Ejecuta `/setup-roles` para recrear los mensajes.';
      color = 0xffa500; // Naranja
      break;
    case 'stats_message_deleted':
      title = '⚠️ Mensaje de Estadísticas Eliminado';
      description =
        `El mensaje de **estadísticas de jugadores** en el canal <#${channel.id}> ha sido eliminado.\n\n` +
        'Las estadísticas automáticas ya no se muestran en este canal.\n\n' +
        '**Solución:** Ejecuta `/setup-roles` para recrear los mensajes.';
      color = 0xffa500; // Naranja
      break;
    case 'both_deleted':
      title = '⚠️ Mensajes de Setup-Roles Eliminados';
      description =
        `Los mensajes de **selección de rango y estadísticas** en el canal <#${channel.id}> han sido eliminados.\n\n` +
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

  const alertKey = `${guild.id}:${errorType}`;
  const now = Date.now();

  if (now - (lastSetupAlertAt.get(alertKey) ?? 0) < SETUP_ALERT_COOLDOWN_MS) {
    logApp(
      `Aviso de setup-roles omitido por cooldown (${errorType}) en guild ${guild.name}`
    );
    return;
  }

  lastSetupAlertAt.set(alertKey, now);

  try {
    // Canal de control/admin del servidor (si esta configurado)
    const sentToControl = await sendToControlChannel(guild, '', {
      embeds: [errorEmbed],
    });
    if (sentToControl) {
      logApp(
        `Notificación de error de setup-roles enviada al canal de control del guild ${guild.name}`
      );
      return;
    }

    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [errorEmbed] });
    logApp(
      `Notificación de error de setup-roles enviada por DM al owner ${owner.user.tag} del guild ${guild.name}`
    );
  } catch (sendError) {
    // No se publica en canales públicos.
    logApp(
      `No pude enviar la notificación de error de setup-roles al control/owner del guild ${guild.name}: ${sendError}`
    );
  }
}

/**
 * Notifica errores relacionados con la actualización del embed de Apex Legends.
 * Intenta enviar el aviso al canal de control del servidor (canal de admins).
 * Si no existe o falla, se intenta por DM al owner. No se publica en canales
 * públicos.
 *
 * @param guild - El guild donde ocurrió el error.
 * @param channel - El canal donde se encuentra el mensaje de Apex que falló al actualizarse.
 * @param errorType - Tipo de evento de Apex ('missing_permissions', 'message_not_found', 'panel_recreated', 'recovery_suspended', 'channel_not_found' o 'unknown').
 * @param details - Detalles técnicos adicionales del error para diagnóstico avanzado (opcional).
 */
export async function notifyApexUpdateError(
  guild: Guild,
  channel: TextChannel,
  errorType: ApexNotifyType,
  details?: string
): Promise<void> {
  let title: string;
  let description: string;
  let color: number;

  switch (errorType) {
    case 'missing_permissions':
      title = '⚠️ Error de Actualización de Apex';
      description =
        `No pude actualizar el embed de estado de Apex Legends en el canal <#${channel.id}>.\n\n` +
        'Verifica que el bot tenga permisos para **Gestionar Mensajes** en ese canal.\n\n' +
        'Si el problema persiste, ejecuta `/apex-status` de nuevo para resetear.';
      color = 0xff0000; // Rojo
      break;
    case 'message_not_found':
      title = '⚠️ Mensaje de Apex No Encontrado';
      description =
        `El mensaje de estado de Apex Legends en el canal <#${channel.id}> no fue encontrado. Puede haber sido eliminado.\n\n` +
        'El bot intentará recrearlo automáticamente.';
      color = 0xffa500; // Naranja
      break;
    case 'panel_recreated':
      title = '✅ Panel de Apex Recreado';
      description =
        `El panel de Apex Legends en el canal <#${channel.id}> fue eliminado o no estaba disponible.\n\n` +
        'El bot creó un mensaje nuevo y lo volvió a registrar para las actualizaciones automáticas.';
      color = 0x00ff00; // Verde
      break;
    case 'recovery_suspended':
      title = '⚠️ Recuperacion del Panel de Apex Suspendida';
      description =
        `No se pudo recrear el panel de Apex Legends en el canal <#${channel.id}> después de varios intentos.\n\n` +
        `Detalle: ${details || 'Sin detalles'}.\n\n` +
        'Revisa permisos y el estado del canal. Ejecuta `/apex-status` para reiniciar la recuperación.';
      color = 0xff0000; // Rojo
      break;
    case 'channel_not_found':
      title = '⚠️ Canal del Panel de Apex No Encontrado';
      description =
        `El canal configurado para el panel de Apex Legends ya no existe o el bot no tiene acceso.\n\n` +
        'Ejecuta `/apex-status` en el canal correcto para volver a registrar el panel.';
      color = 0xff0000; // Rojo
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
    // Canal de control/admin del servidor (si esta configurado)
    const sentToControl = await sendToControlChannel(guild, '', {
      embeds: [errorEmbed],
    });
    if (sentToControl) {
      await logApp(
        `Notificación de error de Apex enviada al canal de control del guild ${guild.name}`
      );
      return;
    }

    // Alternativa: DM al owner del servidor
    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [errorEmbed] });
    logApp(
      `Notificación de error enviada por DM al owner ${owner.user.tag} del guild ${guild.name}`
    );
  } catch (sendError) {
    // No se publica en canales públicos.
    logApp(
      `No pude enviar la notificación de error de Apex al control/owner del guild ${guild.name}: ${sendError}`
    );
  }
}
