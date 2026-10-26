import type { SKRSContext2D } from '@napi-rs/canvas';
import type { Img } from '../interfaces/avatars';

/** Datos del badge de rango que se dibuja sobre el avatar. */
export interface RankBadge {
  /** Imagen del badge. */
  img?: Img | null;
  /** Texto alternativo cuando no hay imagen. */
  text?: string | null;
  /** Color del aura del badge. */
  color?: string;
}

/**
 * Recorta el texto si excede el ancho máximo, agregando "…".
 *
 * @param ctx - Contexto de dibujo.
 * @param text - Texto a recortar.
 * @param maxWidth - Ancho máximo disponible.
 * @returns El texto recortado.
 */
function ellipsize(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number
): string {
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
}

/**
 * Dibuja un efecto "pulse" (halo circular con gradiente) detrás de un elemento.
 *
 * @param ctx - Contexto de dibujo.
 * @param centerX - Centro horizontal.
 * @param centerY - Centro vertical.
 * @param radius - Radio base del aura.
 * @param color - Color del aura.
 */
function drawPulse(
  ctx: SKRSContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  color: string
): void {
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
}

/**
 * Dibuja el nombre del usuario debajo del avatar, ajustando el tamaño y
 * recortando si es necesario.
 *
 * @param ctx - Contexto de dibujo.
 * @param label - Nombre a dibujar.
 * @param centerX - Centro horizontal del label.
 * @param centerY - Centro vertical del label.
 * @param maxWidth - Ancho máximo disponible.
 */
export function drawUserLabel(
  ctx: SKRSContext2D,
  label: string,
  centerX: number,
  centerY: number,
  maxWidth: number
): void {
  let fontSize = 22;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (; fontSize >= 16; fontSize--) {
    ctx.font = `${fontSize}px "Montserrat Bold"`;
    if (ctx.measureText(label).width <= maxWidth) break;
  }
  const text = ellipsize(ctx, label, maxWidth);
  ctx.font = `20px "Montserrat Bold"`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, centerX, centerY);
}

/**
 * Dibuja el badge de rango en la esquina inferior derecha del avatar.
 *
 * @param ctx - Contexto de dibujo.
 * @param x - Origen horizontal del avatar.
 * @param y - Origen vertical del avatar.
 * @param size - Tamaño del avatar.
 * @param badge - Imagen, texto o color del badge.
 * @param auraSize - Tamaño del aura.
 */
export function drawRankBadge(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  size: number,
  badge: RankBadge,
  auraSize: number
): void {
  if (!badge.img && !badge.text) return;
  const r = Math.round(size * 0.26);
  const cx = x + size - r - 4;
  const cy = y + size - r - 4;

  ctx.save();

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
    ctx.font = `${Math.max(16, Math.round(r * 1.2))}px "Montserrat Bold"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badge.text, cx, cy);
  }

  ctx.restore();
}

