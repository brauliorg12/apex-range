import { createCanvas, loadImage } from '@napi-rs/canvas';

/**
 * Genera una imagen PNG circular con efecto "pulse" para mostrar el rango de Apex.
 * - Dibuja un halo circular con gradiente radial usando el color del rango.
 * - Centra y recorta el logo del rango (emoji) en el círculo interior.
 * - El resultado es un ícono visualmente destacado para embeds o cards de perfil.
 *
 * @param emojiUrl URL de la imagen del rango (emoji).
 * @param color Color base del rango en formato hexadecimal (ej: "#ffd700").
 * @param size Tamaño en píxeles del canvas (por defecto 96).
 * @returns Buffer PNG listo para enviar o guardar.
 */
export async function renderRankPulsePng(
  emojiUrl: string,
  color: string,
  size = 96
): Promise<Buffer> {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const emojiImg = await loadImage(emojiUrl);

  // Efecto pulse: halo circular con gradiente radial
  const centerX = size / 2;
  const centerY = size / 2;
  const innerRadius = size * 0.38;
  const outerRadius = size * 0.48;

  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );
  gradient.addColorStop(0, color + '55'); // color con alpha
  gradient.addColorStop(0.7, color + '22');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Logo centrado
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(emojiImg, size * 0.12, size * 0.12, size * 0.76, size * 0.76);
  ctx.restore();

  return await canvas.encode('png');
}
