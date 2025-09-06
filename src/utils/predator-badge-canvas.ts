import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { join } from 'path';

// Registra Montserrat Bold
GlobalFonts.registerFromPath(join(__dirname, '..', 'assets', 'fonts', 'Montserrat-Bold.ttf'), 'Montserrat Bold');
console.log('Fuentes registradas:', GlobalFonts.families);

/**
 * Renderiza un badge de Apex Predator con el logo y la posición ladder.
 * Incluye un efecto pulse rojo detrás del logo y fondo transparente.
 * @param logoBuffer Buffer de imagen PNG/JPG del logo de Predator.
 * @param ladderPos Número de posición en el ranking.
 * @param opts Opciones de tamaño (opcional).
 * @returns Buffer PNG listo para enviar.
 */
export async function renderPredatorBadge(
  logoBuffer: Buffer,
  ladderPos: number,
  opts?: { size?: number }
) {
  const size = opts?.size ?? 160;
  const canvas = createCanvas(size, size + 48);
  const ctx = canvas.getContext('2d');

  // Fondo transparente (no dibujar nada)
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Pulse rojo detrás del logo
  const centerX = size / 2;
  const centerY = size / 2 + 12;
  const innerRadius = size * 0.36;
  const outerRadius = size * 0.48;
  const pulseGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    innerRadius,
    centerX,
    centerY,
    outerRadius
  );
  pulseGradient.addColorStop(0, '#e74c3c88'); // rojo con alpha
  pulseGradient.addColorStop(0.7, '#e74c3c33');
  pulseGradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = pulseGradient;
  ctx.fill();
  ctx.restore();

  // Logo centrado
  const logo = await loadImage(logoBuffer);
  const logoSize = size * 0.85;
  ctx.drawImage(logo, (size - logoSize) / 2, 12, logoSize, logoSize);

  // LadderPos: texto grande, blanco, sin borde
  ctx.save();
  ctx.font = `bold ${Math.floor(
    size / 3.6 // Reducido para achicar el texto
  )}px "Montserrat Bold", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 8;
  const text = `#${ladderPos}`;
  const x = size / 2;
  const y = size + 8;

  ctx.fillStyle = '#fff';
  ctx.fillText(text, x, y);
  ctx.restore();

  return {
    buffer: canvas.toBuffer('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}
