import type { SKRSContext2D } from '@napi-rs/canvas';
import type { AvatarCardItem } from '../interfaces/avatars';

/**
 * Dibuja el avatar circular o el placeholder de un ítem.
 *
 * @param ctx - Contexto de dibujo.
 * @param item - Ítem con avatar opcional.
 * @param x - Origen horizontal del avatar.
 * @param y - Origen vertical del avatar.
 * @param size - Tamaño del avatar.
 */
export function drawCircularAvatar(
  ctx: SKRSContext2D,
  item: AvatarCardItem,
  x: number,
  y: number,
  size: number
): void {
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (item.avatar) {
    ctx.drawImage(item.avatar, x, y, size, size);
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
}

/**
 * Obtiene el color de badge opcional de un ítem.
 *
 * @param item - Ítem del card de avatares.
 * @returns El color si está definido.
 */
export function getAvatarBadgeColor(
  item: AvatarCardItem
): string | undefined {
  if ('badgeColor' in item && typeof item.badgeColor === 'string') {
    return item.badgeColor;
  }

  return undefined;
}
