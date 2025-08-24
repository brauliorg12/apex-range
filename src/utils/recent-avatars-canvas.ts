import { createCanvas, loadImage } from '@napi-rs/canvas';
import { performance } from 'node:perf_hooks';

type Img = any;

export interface AvatarCardItem {
  avatar: Img | null;
  badgeImg?: Img | null;
  badgeText?: string | null;
  label: string;
}

export interface AvatarCardOptions {
  size?: number;
  pad?: number;
  labelHeight?: number;
}

const ellipsize = (ctx: any, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ell = '…';
  let lo = 0,
    hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const t = text.slice(0, mid) + ell;
    if (ctx.measureText(t).width <= maxWidth) lo = mid + 1;
    else hi = mid;
  }
  return text.slice(0, Math.max(0, lo - 1)) + ell;
};

const drawUserLabel = (
  ctx: any,
  label: string,
  centerX: number,
  centerY: number,
  maxWidth: number
) => {
  let fontSize = 22;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (; fontSize >= 16; fontSize--) {
    ctx.font = `700 ${fontSize}px sans-serif`;
    if (ctx.measureText(label).width <= maxWidth) break;
  }
  const text = ellipsize(ctx, label, maxWidth);
  ctx.lineWidth = Math.max(2, Math.round(fontSize / 4));
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.strokeText(text, centerX, centerY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY);
};

const drawRankBadge = (
  ctx: any,
  x: number,
  y: number,
  size: number,
  badge: { img?: Img | null; text?: string | null }
) => {
  if (!badge.img && !badge.text) return;
  const r = Math.round(size * 0.26);
  const cx = x + size - r - 4;
  const cy = y + size - r - 4;

  ctx.save();

  if (badge.img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const d = (r - 1) * 2;
    ctx.drawImage(badge.img, cx - d / 2, cy - d / 2, d, d);
    ctx.restore();
  } else if (badge.text) {
    ctx.font = `bold ${Math.max(16, Math.round(r * 1.2))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeText(badge.text!, cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badge.text!, cx, cy);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.stroke();

  ctx.restore();
};

export async function renderRecentAvatarsCanvas(
  items: AvatarCardItem[],
  opts: AvatarCardOptions = {}
): Promise<{
  buffer: Buffer;
  encodeMs: number;
  width: number;
  height: number;
}> {
  const size = opts.size ?? 128;
  const pad = opts.pad ?? 16;
  const labelHeight = opts.labelHeight ?? 36;

  const cols = items.length; // una fila con N items
  const width = pad + cols * (size + pad);
  const height = size + pad * 2 + labelHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo transparente
  ctx.clearRect(0, 0, width, height);

  // Dibujo por item
  items.forEach((it, idx) => {
    const x = pad + idx * (size + pad);
    const y = pad;

    // Avatar circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (it.avatar) {
      ctx.drawImage(it.avatar, x, y, size, size);
    } else {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x + size / 2, y + size / 2);
    }
    ctx.restore();

    // Badge
    drawRankBadge(ctx, x, y, size, { img: it.badgeImg, text: it.badgeText });

    // Label
    const labelCenterX = x + size / 2;
    const labelCenterY = y + size + Math.floor(labelHeight / 2) - 2;
    drawUserLabel(ctx, it.label, labelCenterX, labelCenterY, size);
  });

  // Encode y métricas
  const tEncodeStart = performance.now();
  const buffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart);

  return { buffer, encodeMs, width, height };
}

export { loadImage };
