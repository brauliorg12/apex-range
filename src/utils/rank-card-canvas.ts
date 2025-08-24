import { createCanvas, loadImage } from '@napi-rs/canvas';

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

  // Logo pulse
  const logoSize = height * 0.7;
  const logoY = (height - logoSize) / 2;
  const pulseBuffer = await (await import('./rank-pulse-canvas')).renderRankPulsePng(emojiUrl, color, logoSize);
  const pulseImg = await loadImage(pulseBuffer);

  // Texto
  ctx.font = `bold 20px sans-serif`;
  const text = label.toUpperCase();
  const paddingLeft = 4; // antes 18, ahora más pegado
  const logoX = paddingLeft;
  ctx.drawImage(pulseImg, logoX, logoY, logoSize, logoSize);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.fillText(text, logoX + logoSize + 8, height / 2); // menos espacio entre logo y texto

  ctx.shadowBlur = 0;

  return await canvas.encode('png');
}
