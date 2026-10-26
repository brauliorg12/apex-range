import type { AttachmentBuilder, EmbedBuilder } from 'discord.js';

// Fingerprints por guild y messageId; acotado por guild.
const cardFingerprints = new Map<string, Map<string, string>>();
const MAX_FINGERPRINTS_PER_GUILD = 32;

/**
 * Obtiene el fingerprint guardado para un mensaje.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param messageId - ID del mensaje del card.
 * @returns El fingerprint o `undefined` si no existe.
 */
export function getCardFingerprint(
  guildId: string,
  messageId: string
): string | undefined {
  return cardFingerprints.get(guildId)?.get(messageId);
}

/**
 * Guarda el fingerprint de un card y acota la cantidad por guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param messageId - ID del mensaje del card.
 * @param fingerprint - Fingerprint del contenido visible.
 */
export function rememberCardFingerprint(
  guildId: string,
  messageId: string,
  fingerprint: string
): void {
  let store = cardFingerprints.get(guildId);
  if (!store) {
    store = new Map<string, string>();
    cardFingerprints.set(guildId, store);
  }

  store.set(messageId, fingerprint);

  if (store.size > MAX_FINGERPRINTS_PER_GUILD) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) {
      store.delete(oldest);
    }
  }
}

/**
 * Elimina el fingerprint de un mensaje.
 *
 * @param guildId - El ID único del servidor de Discord.
 * @param messageId - ID del mensaje del card.
 */
export function forgetCardFingerprint(
  guildId: string,
  messageId: string
): void {
  const store = cardFingerprints.get(guildId);
  if (!store) return;

  store.delete(messageId);
  if (store.size === 0) {
    cardFingerprints.delete(guildId);
  }
}

/**
 * Descarta todos los fingerprints de un guild.
 *
 * @param guildId - El ID único del servidor de Discord.
 */
export function forgetRankCardFingerprints(guildId: string): void {
  cardFingerprints.delete(guildId);
}

/**
 * Construye un fingerprint estable del contenido visible de un card.
 *
 * Incluye el embed completo, los componentes, los nombres de adjuntos y el
 * messageId para no reutilizar comparaciones entre mensajes distintos.
 *
 * @param messageId - ID del mensaje del card.
 * @param embed - Embed que se va a renderizar.
 * @param components - Filas de componentes que se van a renderizar.
 * @param files - Adjuntos que se van a enviar.
 * @returns El fingerprint serializado.
 */
export function buildCardFingerprint(
  messageId: string,
  embed: EmbedBuilder,
  components: ReadonlyArray<{ toJSON(): unknown }>,
  files: readonly AttachmentBuilder[]
): string {
  return JSON.stringify({
    messageId,
    embed: embed.toJSON(),
    components: components.map((component) => component.toJSON()),
    attachments: files.map((file) => file.name),
  });
}
