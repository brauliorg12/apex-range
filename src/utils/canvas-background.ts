export type Img = any;

export interface BackgroundOptions {
  image?: Img | null;
  overlayAlpha?: number; // 0..1
  decorations?: 'none' | 'triangles' | 'stripes';
  gradientFrom?: string;
  gradientTo?: string;
}

/**
 * Dibuja el fondo del header:
 * - Si hay image: aplica cover + overlay opcional.
 * - Si no hay image: usa gradiente limpio.
 * - Decoraciones opcionales: 'none' por defecto.
 */
export function drawCanvasBackground(
  ctx: any,
  w: number,
  h: number,
  accentHex: string,
  opts?: BackgroundOptions
) {
  const image = opts?.image ?? null;
  const overlayAlpha = opts?.overlayAlpha ?? 0.35;
  const decorations = opts?.decorations ?? 'none';
  const from = opts?.gradientFrom ?? '#0b1220';
  const to = opts?.gradientTo ?? '#121722';

  if (image) {
    const iw = image.width ?? w;
    const ih = image.height ?? h;
    const scale = Math.max(w / iw, h / ih);
    const dw = Math.ceil(iw * scale);
    const dh = Math.ceil(ih * scale);
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);
    ctx.drawImage(image, dx, dy, dw, dh);

    if (overlayAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.max(0, Math.min(1, overlayAlpha))})`;
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Decoraciones opcionales
    if (decorations === 'triangles') {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = accentHex;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.65);
      ctx.lineTo(w * 0.35, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w, h * 0.35);
      ctx.lineTo(w * 0.65, 0);
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (decorations === 'stripes') {
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      const stripeW = 18;
      ctx.fillStyle = accentHex;
      for (let x = -w; x < w; x += stripeW * 2) {
        ctx.fillRect(x, -h, stripeW, h * 2);
      }
      ctx.restore();
    }
  }
}
