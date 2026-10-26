import { performance } from 'node:perf_hooks';
import { logCanvas } from './logger';

/**
 * Tipo de recurso visual descargado para el card de avatares.
 */
export type AvatarImageKind = 'avatar' | 'badge';

/**
 * Resultado de descargar una imagen para el card de avatares.
 */
export interface FetchedAvatarImage {
  /** Indica si la descarga terminó con una respuesta válida. */
  ok: boolean;
  /** Contenido descargado, o `null` si falló. */
  buffer: Buffer | null;
  /** Duración de la descarga en milisegundos. */
  elapsed: number;
}

/**
 * Descarga una imagen con timeout y registra solo los fallos.
 *
 * No incluye la URL en el log: alcanza con el tipo, el estado HTTP y la
 * duración.
 *
 * @param url - URL de la imagen a descargar.
 * @param kind - Tipo de recurso para identificar el log.
 * @param ms - Timeout de la descarga en milisegundos.
 * @returns Resultado de la descarga y su duración.
 */
export async function fetchAvatarImage(
  url: string,
  kind: AvatarImageKind,
  ms = 5000
): Promise<FetchedAvatarImage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  const start = performance.now();

  try {
    const response = await fetch(url, { signal: controller.signal });
    const elapsed = Math.round(performance.now() - start);

    if (!response.ok) {
      logCanvas(`[canvas] ${kind}: HTTP ${response.status} en ${elapsed}ms`);
      return { ok: false, buffer: null, elapsed };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { ok: true, buffer, elapsed };
  } catch (error) {
    const elapsed = Math.round(performance.now() - start);
    const errorName =
      error instanceof Error ? error.name : 'Error desconocido';

    if (errorName === 'AbortError') {
      logCanvas(`[canvas] ${kind}: timeout ${ms}ms`);
    } else {
      logCanvas(`[canvas] ${kind}: ${errorName} en ${elapsed}ms`);
    }

    return { ok: false, buffer: null, elapsed };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convierte un emoji personalizado a una URL PNG del CDN de Discord.
 *
 * @param emoji - Emoji en formato `<:nombre:id>` o `<a:nombre:id>`.
 * @returns La URL de la imagen o `null` si el emoji no es personalizado.
 */
export function emojiToCdnPng(emoji: string): string | null {
  const match = emoji.match(/^<a?:\w+:(\d+)>$/);
  if (!match) return null;

  return `https://cdn.discordapp.com/emojis/${match[1]}.png?size=64`;
}
