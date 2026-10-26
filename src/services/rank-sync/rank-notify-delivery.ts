import { Guild } from 'discord.js';
import { sendToControlChannel } from '../../utils/control-channel-helper';
import { logApp } from '../../utils/logger';
import { buildReportEmbed } from './rank-notify-embed';
import {
  buildReportFingerprint,
  getRetryDelayMs,
  hasNotifiableChanges,
  markNotificationDelivered,
  markNotificationFailed,
  shortenFingerprint,
  shouldNotify,
} from './rank-notify-fingerprint';
import type { RankSyncReport } from './rank-notify-types';

/**
 * Registra el detalle técnico del reporte antes de resumirlo en Discord.
 *
 * El detalle completo queda solo en los logs de la app.
 *
 * @param guild - Guild que generó el reporte.
 * @param report - Reporte del rank sync.
 */
async function logReportDetails(
  guild: Guild,
  report: RankSyncReport
): Promise<void> {
  const details = [...report.errors, ...report.warnings];
  if (details.length === 0) return;

  try {
    await logApp(
      `[rank-sync] Detalle del reporte en guild ${guild.name} (${guild.id}): ` +
        details.join(' | ')
    );
  } catch {
    // El fallo de logging no debe impedir la notificación.
  }
}

/**
 * Notifica al canal de control o al owner solo cuando hubo cambios o errores.
 *
 * Deduplica por guild: un reporte idéntico no se repite dentro de la ventana
 * definida después de una entrega exitosa. Un error nuevo o un conjunto
 * distinto se notifica de inmediato. Si fallan el canal de control y el owner,
 * la huella no queda marcada y se reintenta con backoff corto.
 * El detalle técnico se registra en los logs, no en Discord.
 *
 * @param guild - Guild que generó el reporte.
 * @param report - Reporte del rank sync.
 */
export async function notifyRankSync(
  guild: Guild,
  report: RankSyncReport
): Promise<void> {
  if (!hasNotifiableChanges(report)) return;

  const now = Date.now();
  const fingerprint = buildReportFingerprint(report);
  const fingerprintLabel = shortenFingerprint(fingerprint);

  if (!shouldNotify(guild.id, fingerprint, now)) {
    await logApp(
      `[rank-sync] Aviso omitido por deduplicación en guild ${guild.name} ` +
        `(${guild.id}) huella=${fingerprintLabel}`
    ).catch(() => {});
    return;
  }

  await logReportDetails(guild, report);
  const embed = buildReportEmbed(guild, report);

  try {
    const sentToControl = await sendToControlChannel(guild, '', {
      embeds: [embed],
    });
    if (sentToControl) {
      markNotificationDelivered(guild.id, fingerprint);
      await logApp(
        `[rank-sync] Aviso entregado en canal de control: guild=${guild.id} ` +
          `huella=${fingerprintLabel}`
      ).catch(() => {});
      return;
    }

    const owner = await guild.fetchOwner();
    await owner.send({ embeds: [embed] });
    markNotificationDelivered(guild.id, fingerprint);
    await logApp(
      `[rank-sync] Aviso entregado al owner: guild=${guild.id} ` +
        `huella=${fingerprintLabel}`
    ).catch(() => {});
  } catch (error) {
    const failedAttempts = markNotificationFailed(guild.id, fingerprint);
    await logApp(
      `[rank-sync] Entrega fallida: guild=${guild.id} ` +
        `huella=${fingerprintLabel} destino=canal-control/owner ` +
        `intentos=${failedAttempts} reintentoEn=` +
        `${Math.round(getRetryDelayMs(failedAttempts) / 1000)}s: ${error}`
    ).catch(() => {});
  }
}
