import { createCanvas, loadImage } from '@napi-rs/canvas';

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
    centerX, centerY, innerRadius,
    centerX, centerY, outerRadius
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
  ctx.drawImage(
    emojiImg,
    size * 0.12,
    size * 0.12,
    size * 0.76,
    size * 0.76
  );
  ctx.restore();

  return await canvas.encode('png');
}

export async function renderRankHeaderCard(
  emojiUrl: string,
  color: string,
  label: string,
  width = 320,
  height = 64
): Promise<Buffer> {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const logoSize = height * 0.7; // sube de 0.55 a 0.7
  const logoY = (height - logoSize) / 2;

  // Fondo transparente
  ctx.clearRect(0, 0, width, height);

  // Pulse logo
  const pulseBuffer = await renderRankPulsePng(emojiUrl, color, logoSize);
  const pulseImg = await loadImage(pulseBuffer);

  // Texto
  ctx.font = `bold 20px sans-serif`;
  const text = label.toUpperCase();
  const textMetrics = ctx.measureText(text);
  const textWidth = textMetrics.width;

  // Bloque logo+texto alineado a la izquierda (con padding)
  const paddingLeft = 18;
  const logoX = paddingLeft;
  ctx.drawImage(pulseImg, logoX, logoY, logoSize, logoSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fillText(text, logoX + logoSize + 12, height / 2);

  ctx.shadowBlur = 0;

  return await canvas.encode('png');
}
