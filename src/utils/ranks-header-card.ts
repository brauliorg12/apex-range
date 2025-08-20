import { EmbedBuilder, Guild, AttachmentBuilder } from 'discord.js';
import { loadImage } from '@napi-rs/canvas';
import { APEX_RANKS } from '../constants';
import { getRankEmoji } from './emoji-helper';
import { renderRanksHeaderCanvas } from './ranks-header-canvas';
import { performance } from 'node:perf_hooks';

const emojiToCdnPng = (emoji: string): string | null => {
  const m = emoji?.match?.(/^<a?:\w+:(\d+)>$/);
  if (!m) return null;
  const id = m[1];
  return `https://cdn.discordapp.com/emojis/${id}.png?size=128`;
};

const fetchWithTimeout = async (url: string, ms = 5000) => {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), ms);
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: controller.signal });
    const elapsed = Math.round(performance.now() - start);
    if (!res.ok) {
      console.warn(
        `[HeaderCard] Fetch fallo HTTP ${res.status} en ${elapsed}ms – ${url}`
      );
      return { ok: false as const, buffer: null as Buffer | null };
    }
    const ab = await res.arrayBuffer();
    clearTimeout(to);
    return { ok: true as const, buffer: Buffer.from(ab) };
  } catch (e) {
    console.warn('[HeaderCard] Error fetch icon:', (e as any)?.message || e);
    return { ok: false as const, buffer: null as Buffer | null };
  } finally {
    clearTimeout(to);
  }
};

// NUEVO: intenta cargar imagen de fondo desde env
const loadHeaderBg = async (): Promise<any | null> => {
  const url = process.env.RANKS_HEADER_BG_URL;
  if (!url) return null;
  const r = await fetchWithTimeout(url, 8000);
  if (!r.ok || !r.buffer) return null;
  try {
    return await loadImage(r.buffer);
  } catch {
    return null;
  }
};

// NUEVO: solo el attachment para embebido en el header existente
export async function buildRanksHeaderAttachment(guild: Guild) {
  try {
    const iconImages = await Promise.all(
      APEX_RANKS.map(async (rk) => {
        const emoji = getRankEmoji(guild.client, rk) || rk.icon || '';
        const cdn = emojiToCdnPng(emoji);
        if (cdn) {
          const r = await fetchWithTimeout(cdn, 6000);
          if (r.ok && r.buffer) {
            try {
              const img = await loadImage(r.buffer);
              return { img, label: rk.label };
            } catch {
              return { img: null, label: rk.label };
            }
          }
        }
        return { img: null, label: rk.label };
      })
    );

    const bgImg = await loadHeaderBg(); // <-- NUEVO

    const { buffer } = await renderRanksHeaderCanvas(iconImages, {
      iconSize: 96,
      pad: 24,
      showLabels: true,
      showTitle: false, // <-- sin título dentro del PNG
      accentHex: '#e74c3c',
      background: { image: bgImg, overlayAlpha: 0.4, decorations: 'none' }, // <-- CAMBIO
      topBarHeight: 4, // <-- NUEVO
      bottomHairline: true, // <-- NUEVO
      hairlineAlpha: 0.4, // <-- NUEVO
    });

    const name = 'ranks-header.png';
    const attachment = new AttachmentBuilder(buffer, { name });
    return { attachment, name };
  } catch (e) {
    console.error('[HeaderCard] Error al construir el attachment:', e);
    return null;
  }
}
