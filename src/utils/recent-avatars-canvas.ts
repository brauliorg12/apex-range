import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';
import { performance } from 'node:perf_hooks';
import type { AvatarCardItem, AvatarCardOptions } from '../interfaces/avatars';
import { drawRankBadge, drawUserLabel } from './recent-avatars-draw';
import {
  drawCircularAvatar,
  getAvatarBadgeColor,
} from './recent-avatars-avatar';

GlobalFonts.registerFromPath(
  join(__dirname, '..', 'assets', 'fonts', 'Montserrat-Bold.ttf'),
  'Montserrat Bold'
);

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
  const auraSize = opts.auraSize ?? 16;

  const cols = items.length;
  const width = pad + cols * (size + pad);
  const height = size + pad * 2 + labelHeight;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, width, height);

  items.forEach((it, idx) => {
    const x = pad + idx * (size + pad);
    const y = pad;

    drawCircularAvatar(ctx, it, x, y, size);
    drawRankBadge(
      ctx,
      x,
      y,
      size,
      {
        img: it.badgeImg,
        text: it.badgeText,
        color: getAvatarBadgeColor(it),
      },
      auraSize
    );

    const labelCenterX = x + size / 2;
    const labelCenterY = y + size + Math.floor(labelHeight / 2) - 2;
    drawUserLabel(ctx, it.label, labelCenterX, labelCenterY, size * 0.85);
  });

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

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  items.forEach((it, idx) => {
    const x = pad + idx * (size + pad);
    const y = pad;

    drawCircularAvatar(ctx, it, x, y, size);
    drawRankBadge(
      ctx,
      x,
      y,
      size,
      {
        img: it.badgeImg,
        text: it.badgeText,
        color: opts.badgeColor || getAvatarBadgeColor(it),
      },
      auraSize
    );

    const labelCenterX = x + size / 2;
    const labelCenterY = y + size + Math.floor(labelHeight / 2) - 2;
    drawUserLabel(ctx, it.label, labelCenterX, labelCenterY, size * 0.85);
  });

  const tEncodeStart = performance.now();
  const buffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart);

  return { buffer, encodeMs, width, height };
}

export { loadImage } from '@napi-rs/canvas';
