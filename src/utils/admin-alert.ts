import {
  describeAdminAlertThrottle,
  finishAdminAlertAttempt,
  setLastAdminAlert,
  tryBeginAdminAlertAttempt,
} from './admin-alert-state';
import {
  buildAlertSummary,
  safeLog,
  sendAdminWebhook,
} from './admin-alert-webhook';
import type {
  AdminAlertInput,
  AdminAlertRecord,
  CorruptStateAlertInput,
} from './admin-alert-types';

export type {
  AdminAlertErrorType,
  AdminAlertInput,
  AdminAlertRecord,
  CorruptStateAlertInput,
} from './admin-alert-types';
export { forgetAdminAlerts, getLastAdminAlert } from './admin-alert-state';

/**
 * Emite una alerta de infraestructura al administrador de la app.
 *
 * Escribe un log crítico, registra la última alerta en memoria y envía un
 * resumen opcional a `ADMIN_ALERT_WEBHOOK_URL`. Aplica throttle por guild y
 * archivo solo después de una emisión exitosa; si el webhook falla, permite
 * un reintento con retraso corto.
 *
 * No usa canales del guild ni DM al owner: esta alerta es exclusiva del
 * administrador de la app.
 *
 * @param input - Datos de la alerta.
 */
export async function notifyAdminAlert(input: AdminAlertInput): Promise<void> {
  const now = Date.now();
  const throttleKey = `${input.guildId}:${input.file}`;
  const attempt = tryBeginAdminAlertAttempt(throttleKey, now);

  if (!attempt) {
    await safeLog(
      `[admin-alert] Alerta omitida por throttle: guild=${input.guildId} ` +
        `archivo=${input.file} ` +
        `estado=${describeAdminAlertThrottle(throttleKey)}`
    );
    return;
  }

  const summary = buildAlertSummary(input);
  const record: AdminAlertRecord = {
    ...input,
    emittedAt: new Date(now).toISOString(),
    webhookDelivered: false,
  };
  setLastAdminAlert(record);

  await safeLog(`[admin-alert][CRITICAL] ${summary}`);
  const webhookResult = await sendAdminWebhook(summary);
  record.webhookDelivered = webhookResult === 'delivered';

  // Sin webhook configurado, la alerta queda en el log crítico y cuenta como
  // emisión exitosa para no reintentar algo que no tiene destino remoto.
  const delivered = webhookResult !== 'failed';
  finishAdminAlertAttempt(throttleKey, attempt, delivered);

  await safeLog(
    `[admin-alert] Resultado del webhook: ${webhookResult} ` +
      `(guild=${input.guildId}, archivo=${input.file}).`
  );
}

/**
 * Emite la alerta estándar de `.bot-state` corrupto o ilegible.
 *
 * Centraliza el archivo y la acción sugerida para que el arranque, la
 * reincorporación, los eventos de rol y los writers de estado emitan
 * exactamente la misma alerta. El throttle de `notifyAdminAlert` evita
 * duplicados cuando otro flujo vuelve a detectar el mismo problema.
 *
 * No notifica al owner ni al canal de control del guild.
 *
 * @param input - Guild afectada, tipo de fallo y estado del panel.
 */
export async function notifyCorruptStateAlert(
  input: CorruptStateAlertInput
): Promise<void> {
  const file = `.bot-state/${input.guildId}.json`;

  await notifyAdminAlert({
    guildId: input.guildId,
    guildName: input.guildName,
    file,
    errorType: input.errorType,
    suggestedAction: `revisar/restaurar ${file}; no borrar players_*.json`,
    panelIntact: input.panelIntact ?? true,
  });
}
