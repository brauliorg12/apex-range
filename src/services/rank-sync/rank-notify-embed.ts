import { EmbedBuilder, Guild } from 'discord.js';
import type { RankSyncReport } from './rank-notify-types';

/**
 * Prefijos de errores que el admin del guild puede resolver desde el panel.
 */
const PANEL_CHANNEL_ERROR_PREFIXES = [
  'El estado del guild no tiene canal de panel.',
  'Canal del panel no encontrado:',
] as const;

/**
 * Prefijo de los avisos de borrado que incluyen el error técnico.
 */
const DELETE_WARNING_PREFIX = 'No se pudo borrar el mensaje ';

/**
 * Indica si un error se refiere a la configuración del canal del panel.
 *
 * @param error - Mensaje de error del reporte.
 * @returns `true` si el admin del guild puede resolverlo desde Discord.
 */
function isPanelChannelError(error: string): boolean {
  return PANEL_CHANNEL_ERROR_PREFIXES.some((prefix) =>
    error.startsWith(prefix)
  );
}

/**
 * Normaliza los avisos antes de mostrarlos.
 *
 * Agrupa los avisos de borrado en un mensaje accionable sin IDs ni errores
 * crudos; el resto de los avisos se conserva.
 *
 * @param warnings - Avisos del reporte.
 * @returns Los avisos listos para el embed.
 */
function buildSafeWarnings(warnings: readonly string[]): string[] {
  const safeWarnings: string[] = [];
  let hasDeleteWarning = false;

  for (const warning of warnings) {
    if (warning.startsWith(DELETE_WARNING_PREFIX)) {
      hasDeleteWarning = true;
    } else {
      safeWarnings.push(warning);
    }
  }

  if (hasDeleteWarning) {
    safeWarnings.push(
      'No se pudieron borrar algunos mensajes viejos del panel. ' +
        'Revisá los permisos del canal.'
    );
  }

  return safeWarnings;
}

/**
 * Construye el embed con el reporte accionable del sync.
 *
 * Los detalles técnicos se omiten: solo se muestran roles, acciones y un
 * resumen de errores apto para el control del guild o el owner.
 *
 * @param guild - Guild que generó el reporte.
 * @param report - Reporte del rank sync.
 * @returns El embed listo para enviar.
 */
export function buildReportEmbed(
  guild: Guild,
  report: RankSyncReport
): EmbedBuilder {
  const hasErrors = report.errors.length > 0;
  const hasWarnings =
    report.warnings.length > 0 ||
    report.missingRoles.length > 0 ||
    report.roleCandidates.length > 0;
  const color = hasErrors ? 0xff0000 : hasWarnings ? 0xffa500 : 0x00ff00;
  const panelChannelErrors = report.errors.filter(isPanelChannelError);
  const internalErrors = report.errors.filter(
    (error) => !isPanelChannelError(error)
  );
  const safeWarnings = buildSafeWarnings(report.warnings);

  const embed = new EmbedBuilder()
    .setTitle('Sincronización de rangos')
    .setColor(color)
    .setTimestamp()
    .setFooter({
      text: `${guild.name} (${guild.id}) | Motivo: ${report.reason}`,
    });

  if (report.createdRoles.length > 0) {
    embed.addFields({
      name: 'Roles creados',
      value: report.createdRoles
        .map((roleName) => `• ${roleName}: faltaba el rol en el servidor`)
        .join('\n'),
      inline: false,
    });
  }

  if (report.roleCandidates.length > 0) {
    embed.addFields({
      name: 'Roles candidatos',
      value: report.roleCandidates
        .map(
          (candidate) =>
            `• ${candidate.rankLabel} → ${candidate.roleName}: usá ` +
            '/setup-roles para adoptarlo o mapearlo.'
        )
        .join('\n'),
      inline: false,
    });
  }

  if (report.missingRoles.length > 0) {
    embed.addFields({
      name: 'Roles faltantes',
      value:
        `${report.missingRoles.map((roleName) => `• ${roleName}`).join('\n')}\n` +
        'No se crearon. Revisá el permiso Gestionar roles, la jerarquía ' +
        'o mapeá el rol existente con /setup-roles.',
      inline: false,
    });
  }

  if (report.panelUpdated) {
    embed.addFields({
      name: 'Panel',
      value: `Reconstruido con ${report.cardCount} cards.`,
      inline: false,
    });
  }

  if (safeWarnings.length > 0) {
    embed.addFields({
      name: 'Avisos',
      value: safeWarnings.join('\n'),
      inline: false,
    });
  }

  if (panelChannelErrors.length > 0) {
    embed.addFields({
      name: 'Canal del panel',
      value:
        'No se encontró el canal configurado. Recreá el canal o ejecutá ' +
        '/setup-roles.',
      inline: false,
    });
  }

  if (internalErrors.length > 0) {
    embed.addFields({
      name: 'Errores',
      value:
        'No se pudo completar la sincronización. Revisá el estado del panel ' +
        'en el canal y el detalle técnico en los logs del servidor. Si el ' +
        'panel quedó incompleto o desactualizado, ejecutá /setup-roles o ' +
        'contactá al administrador de la app.',
      inline: false,
    });
  }

  return embed;
}
