import fetch from 'node-fetch';
import { logApp } from './logger';
import type {
  AdminAlertInput,
  AdminWebhookResult,
} from './admin-alert-types';

/**
 * Tiempo máximo de espera del webhook para no bloquear el flujo que alerta.
 */
const ADMIN_ALERT_WEBHOOK_TIMEOUT_MS = 5_000;

/**
 * Obtiene el nombre de un error sin exponer su mensaje ni la URL del webhook.
 *
 * @param error - Error recibido.
 * @returns El nombre del error o una etiqueta genérica.
 */
function getErrorName(error: unknown): string {
  return error instanceof Error ? error.name : 'Error desconocido';
}

/**
 * Escribe en el log de la app sin permitir que un fallo de logging
 * interrumpa el flujo de alertas.
 *
 * @param message - Mensaje a registrar.
 */
export async function safeLog(message: string): Promise<void> {
  try {
    await logApp(message);
  } catch {
    // El fallo de logging no debe propagarse al rank sync.
  }
}

/**
 * Construye el resumen técnico de la alerta sin datos sensibles.
 *
 * @param input - Datos de la alerta.
 * @returns El resumen listo para logs y webhook.
 */
export function buildAlertSummary(input: AdminAlertInput): string {
  const panelStatus = input.panelIntact
    ? 'intacto; no se modificaron roles, mensajes ni estado.'
    : 'debe revisarse.';
  const guildLabel = input.guildName
    ? `${input.guildName} (${input.guildId})`
    : input.guildId;

  return [
    '[ALERTA-ADMIN] Estado de guild corrupto o ilegible',
    `Guild: ${guildLabel}`,
    `Archivo: ${input.file}`,
    `Tipo: ${input.errorType}`,
    `Acción: ${input.suggestedAction}`,
    `Panel anterior: ${panelStatus}`,
  ].join('\n');
}

/**
 * Envía el resumen al webhook de administración si está configurado.
 *
 * No lanza errores ni bloquea el flujo: cualquier fallo queda en el log.
 *
 * @param summary - Resumen técnico de la alerta.
 * @returns El resultado del envío al webhook.
 */
export async function sendAdminWebhook(
  summary: string
): Promise<AdminWebhookResult> {
  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return 'not-configured';

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ADMIN_ALERT_WEBHOOK_TIMEOUT_MS
  );

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: summary,
        allowed_mentions: { parse: [] },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      await safeLog(
        `[admin-alert] El webhook respondió con estado ${response.status}.`
      );
      return 'failed';
    }

    return 'delivered';
  } catch (error) {
    await safeLog(
      `[admin-alert] No se pudo enviar la alerta al webhook ` +
        `(${getErrorName(error)}).`
    );
    return 'failed';
  } finally {
    clearTimeout(timeout);
  }
}
