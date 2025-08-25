import { createCanvas, loadImage } from '@napi-rs/canvas';

/**
 * Genera una imagen de card visual para un rango de Apex.
 * Incluye el logo pulse y el nombre del rango alineados a la izquierda,
 * y un borde inferior intenso del color del rango.
 * El fondo es transparente.
 * @param emojiUrl URL del emoji/logo del rango.
 * @param color Color principal del rango (hex o rgb).
 * @param label Nombre del rango (texto).
 * @param opts Opciones de tamaño (width, height).
 * @returns Buffer PNG de la imagen generada.
 */
export async function renderRankCardCanvas(
  emojiUrl: string,
  color: string,
  label: string,
  opts: { width?: number; height?: number } = {}
): Promise<Buffer> {
  const width = opts.width ?? 320;
  const height = opts.height ?? 64;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  // Borde inferior intenso de extremo a extremo
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, height - 2);
  ctx.lineTo(width, height - 2);
  ctx.stroke();
  ctx.restore();

  // Logo pulse y texto
  const logoSize = height * 0.88;
  const logoY = (height - logoSize) / 2;
  const pulseBuffer = await (
    await import('./rank-pulse-canvas')
  ).renderRankPulsePng(emojiUrl, color, logoSize);
  const pulseImg = await loadImage(pulseBuffer);

  // Texto
  ctx.font = `bold 20px sans-serif`;
  const text = label.toUpperCase();
  const paddingLeft = 4;
  const logoX = paddingLeft;
  ctx.drawImage(pulseImg, logoX, logoY, logoSize, logoSize);

  // Alineación del texto
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fillText(text, logoX + logoSize + 8, height / 2);

  ctx.shadowBlur = 0;

  return await canvas.encode('png');
}
