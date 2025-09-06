import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';

// Registra Montserrat Bold
GlobalFonts.registerFromPath(
  join(__dirname, '..', 'assets', 'fonts', 'Montserrat-Bold.ttf'),
  'Montserrat Bold'
);
console.log('Fuentes registradas:', GlobalFonts.families);

import { performance } from 'node:perf_hooks';
import { AvatarCardItem, AvatarCardOptions, Img } from '../interfaces/avatars';

/**
 * Recorta el texto si excede el ancho máximo, agregando "…".
 */
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

/**
 * Dibuja el nombre del usuario debajo del avatar, ajustando el tamaño y recortando si es necesario.
 */
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
    ctx.font = `${fontSize}px "Montserrat Bold"`; // Usa Montserrat Bold
    if (ctx.measureText(label).width <= maxWidth) break;
  }
  const text = ellipsize(ctx, label, maxWidth);
  ctx.font = `20px "Montserrat Bold"`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY);
};

/**
 * Dibuja un efecto "pulse" (halo circular con gradiente) detrás de un elemento.
 * Usado para resaltar avatares y badges.
 */
const drawPulse = (
  ctx: any,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
) => {
  const innerRadius = radius * 0.7;
  const outerRadius = radius * 1.1;
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );
  gradient.addColorStop(0, color + '88');
  gradient.addColorStop(0.7, color + '33');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
};

/**
 * Dibuja el badge de rango en la esquina inferior derecha del avatar.
 * Puede ser una imagen (emoji personalizado) o texto (emoji estándar).
 * Ahora incluye un pulse detrás del badge usando el color del rango.
 */
const drawRankBadge = (
  ctx: any,
  x: number,
  y: number,
  size: number,
  badge: { img?: Img | null; text?: string | null; color?: string },
  auraSize: number
) => {
  if (!badge.img && !badge.text) return;
  const r = Math.round(size * 0.26);
  const cx = x + size - r - 4;
  const cy = y + size - r - 4;

  ctx.save();

  // Pulse detrás del badge usando el color del rango y auraSize
  drawPulse(ctx, cx, cy, auraSize, badge.color || '#2ecc71');

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
    ctx.font = `${Math.max(16, Math.round(r * 1.2))}px "Montserrat Bold"`; // Usa Montserrat Bold
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badge.text!, cx, cy);
  }

  ctx.restore();
};

/**
 * Renderiza el card visual con los avatares, badges y nombres de los usuarios.
 * - Dibuja el pulse detrás de cada avatar.
 * - Dibuja el avatar circular.
 * - Dibuja el badge de rango en la esquina.
 * - Dibuja el nombre debajo del avatar.
 * @param items Lista de usuarios a mostrar.
 * @param opts Opciones de renderizado.
 * @returns Buffer PNG, métricas y dimensiones.
 */
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
  const auraSize = opts.auraSize ?? 16; // Valor por defecto si no se pasa

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
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Avatar circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (it.avatar) {
      ctx.drawImage(it.avatar, x, y, size, size);
    } else {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '20px "Montserrat Bold"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', centerX, centerY);
    }
    ctx.restore();

    // Badge: ahora pasa auraSize
    drawRankBadge(
      ctx,
      x,
      y,
      size,
      {
        img: it.badgeImg,
        text: it.badgeText,
        color: (it as any).badgeColor, // badgeColor debe venir desde el preparador de datos
      },
      auraSize
    );

    // Label
    const labelCenterX = x + size / 2;
    const labelCenterY = y + size + Math.floor(labelHeight / 2) - 2;
    drawUserLabel(ctx, it.label, labelCenterX, labelCenterY, size * 0.85);
  });

  // Encode y métricas
  const tEncodeStart = performance.now();
  const buffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart);

  return { buffer, encodeMs, width, height };
}

/**
 * Renderiza un card horizontal con los avatares, badges y nombres de los jugadores de un rango.
 * Similar a los cards de jugadores en línea por rango.
 * @param items Lista de jugadores del rango (AvatarCardItem[]).
 * @param opts Opciones de renderizado (color, tamaño, etc).
 * @returns Buffer PNG, métricas y dimensiones.
 */
export async function renderRankPlayersCard(
  items: AvatarCardItem[],
  opts: AvatarCardOptions & {
    backgroundColor?: string;
    badgeColor?: string;
  } = {}
): Promise<{
  buffer: Buffer;
  encodeMs: number;
  width: number;
  height: number;
}> {
  const size = opts.size ?? 128;
  const pad = opts.pad ?? 16;
  const labelHeight = opts.labelHeight ?? 36;
  const auraSize = opts.auraSize ?? 24;
  const backgroundColor = opts.backgroundColor ?? '#23272a';

  const cols = items.length;
  const width = pad + cols * (size + pad);
  const height = size + pad * 2 + labelHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo sólido
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Dibujo por jugador
  items.forEach((it, idx) => {
    const x = pad + idx * (size + pad);
    const y = pad;
    const centerX = x + size / 2;
    const centerY = y + size / 2;

    // Avatar circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    if (it.avatar) {
      ctx.drawImage(it.avatar, x, y, size, size);
    } else {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(x, y, size, size);
      ctx.fillStyle = '#ecf0f1';
      ctx.font = '20px "Montserrat Bold"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', centerX, centerY);
    }
    ctx.restore();

    // Badge de rango en la esquina inferior derecha
    drawRankBadge(
      ctx,
      x,
      y,
      size,
      {
        img: it.badgeImg,
        text: it.badgeText,
        color: opts.badgeColor || (it as any).badgeColor,
      },
      auraSize
    );

    // Label debajo del avatar
    const labelCenterX = x + size / 2;
    const labelCenterY = y + size + Math.floor(labelHeight / 2) - 2;
    drawUserLabel(ctx, it.label, labelCenterX, labelCenterY, size * 0.85);
  });

  // Encode y métricas
  const tEncodeStart = performance.now();
  const buffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart);

  return { buffer, encodeMs, width, height };
}

export { loadImage };
