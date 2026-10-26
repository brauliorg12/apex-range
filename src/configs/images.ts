import { AttachmentBuilder } from 'discord.js';
import { statSync } from 'fs';
import { extname, resolve } from 'path';

/** Nombre del adjunto que Discord referencia en el embed. */
export const INIT_IMAGE_ATTACHMENT_NAME = 'init.png';

/** Tamaño máximo aceptado para la imagen inicial (8 MB). */
const MAX_INIT_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Resultado de resolver la imagen inicial del panel de rangos.
 *
 * `file` es el adjunto que se envía a Discord y `imageUrl` es la referencia
 * interna `attachment://` que usa el embed. Ambos son `null` cuando no hay
 * imagen configurada o el archivo no es válido.
 */
export interface InitImagePayload {
  /** Referencia para `EmbedBuilder.setImage`, o `null`. */
  imageUrl: string | null;
  /** Archivo listo para adjuntar, o `null`. */
  file: AttachmentBuilder | null;
  /** Huella estable para evitar reenvíos innecesarios. */
  fingerprint: string | null;
  /** Motivo legible si la configuración existe pero no se pudo usar. */
  warning: string | null;
}

/**
 * Resuelve la imagen inicial desde `INIT_IMAGE_PATH`.
 *
 * No usa URLs ni valores por defecto: si la variable falta, está vacía o el
 * archivo no es un PNG válido, el panel se muestra sin imagen. La ruta la
 * define el despliegue, nunca una interacción de Discord.
 *
 * @returns El adjunto y la referencia para el embed.
 */
export function resolveInitImage(): InitImagePayload {
  const configuredPath = process.env.INIT_IMAGE_PATH?.trim();

  if (!configuredPath) {
    return {
      imageUrl: null,
      file: null,
      fingerprint: null,
      warning: null,
    };
  }

  const filePath = resolve(configuredPath);

  try {
    const stats = statSync(filePath);
    if (!stats.isFile()) {
      return {
        imageUrl: null,
        file: null,
        fingerprint: null,
        warning: `INIT_IMAGE_PATH no apunta a un archivo: ${filePath}`,
      };
    }

    if (stats.size > MAX_INIT_IMAGE_BYTES) {
      return {
        imageUrl: null,
        file: null,
        fingerprint: null,
        warning: `La imagen inicial supera ${MAX_INIT_IMAGE_BYTES} bytes: ${filePath}`,
      };
    }

    if (extname(filePath).toLowerCase() !== '.png') {
      return {
        imageUrl: null,
        file: null,
        fingerprint: null,
        warning: `La imagen inicial debe ser PNG: ${filePath}`,
      };
    }

    return {
      imageUrl: `attachment://${INIT_IMAGE_ATTACHMENT_NAME}`,
      file: new AttachmentBuilder(filePath, {
        name: INIT_IMAGE_ATTACHMENT_NAME,
      }),
      fingerprint: `${stats.mtimeMs}:${stats.size}`,
      warning: null,
    };
  } catch (error) {
    return {
      imageUrl: null,
      file: null,
      fingerprint: null,
      warning: `No se pudo leer INIT_IMAGE_PATH (${filePath}): ${String(error)}`,
    };
  }
}
