import { createCanvas } from '@napi-rs/canvas';
import { performance } from 'node:perf_hooks';
import {
  drawCanvasBackground,
  type BackgroundOptions,
} from './canvas-background'; // <-- NUEVO

type Img = any;

export interface RankIcon {
  img: Img | null;
  label: string;
}

export interface RanksHeaderOptions {
  iconSize?: number;
  pad?: number;
  title?: string;
  showLabels?: boolean;
  accentHex?: string;
  showTitle?: boolean;
  background?: BackgroundOptions; // <-- NUEVO: reemplaza backgroundImg/overlayAlpha/decorations
  topBarHeight?: number;        // <-- NUEVO
  bottomHairline?: boolean;     // <-- NUEVO
  hairlineAlpha?: number;       // <-- NUEVO
}

// Helper: hex -> rgb
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '').trim();
  const norm =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const r = parseInt(norm.slice(0, 2), 16);
  const g = parseInt(norm.slice(2, 4), 16);
  const b = parseInt(norm.slice(4, 6), 16);
  return { r, g, b };
};

// NUEVO: divisores superior/inferior
const drawDividers = (
  ctx: any,
  w: number,
  h: number,
  accent: string,
  topBarHeight: number,
  bottomHairline: boolean,
  hairlineAlpha: number
) => {
  if (topBarHeight > 0) {
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, w, Math.max(1, Math.floor(topBarHeight)));
    const g = ctx.createLinearGradient(0, topBarHeight, 0, topBarHeight + 24);
    g.addColorStop(0, 'rgba(0,0,0,0.25)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, topBarHeight, w, 24);
  }
  if (bottomHairline) {
    const { r, g, b } = hexToRgb(accent);
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${r},${g},${b},${Math.max(0, Math.min(1, hairlineAlpha))})`;
    ctx.stroke();
  }
};

const drawTitle = (
  ctx: any,
  title: string,
  w: number,
  pad: number,
  accent: string
) => {
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = '800 38px sans-serif';
  // Glow sutil
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, pad, pad);
  ctx.shadowBlur = 0;

  // Subtítulo
  ctx.font = '500 16px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(
    'Puede clickear sobre los jugadores para interactuar',
    pad,
    pad + 46
  );
  ctx.restore();
};

const drawIcon = (
  ctx: any,
  x: number,
  y: number,
  size: number,
  img: Img | null,
  label?: string
) => {
  // Sombras
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Recorte circular
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (img) {
    ctx.drawImage(img, x, y, size, size);
  } else {
    // Placeholder
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + size / 2, y + size / 2);
  }
  ctx.restore();

  // Borde sutil
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 0.5, 0, Math.PI * 2);
  ctx.closePath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.stroke();

  // Label
  if (label) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '700 16px sans-serif';
    // Trazo sutil
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.strokeText(label, x + size / 2, y + size + 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + size / 2, y + size + 8);
  }
  ctx.restore();
};

export async function renderRanksHeaderCanvas(
  icons: RankIcon[],
  opts: RanksHeaderOptions = {}
): Promise<{
  buffer: Buffer;
  encodeMs: number;
  width: number;
  height: number;
}> {
  const iconSize = opts.iconSize ?? 96;
  const pad = opts.pad ?? 24;
  const title = opts.title ?? 'Jugadores por Rango';
  const showLabels = opts.showLabels ?? true;
  const accent = opts.accentHex ?? '#e74c3c';
  const showTitle = opts.showTitle ?? true;
  const topBarHeight = opts.topBarHeight ?? 4;        // <-- NUEVO
  const bottomHairline = opts.bottomHairline ?? true; // <-- NUEVO
  const hairlineAlpha = opts.hairlineAlpha ?? 0.4;    // <-- NUEVO

  const titleBlockH = showTitle ? 72 : 0;
  const labelH = showLabels ? 28 : 0;

  const cols = icons.length;
  const width = pad + cols * (iconSize + pad);
  const height = pad + titleBlockH + iconSize + labelH + pad;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo: delega al módulo nuevo
  drawCanvasBackground(ctx, width, height, accent, opts.background); // <-- CAMBIO

  // Divisores (actúan como “título/divisor” visual)
  drawDividers(
    ctx,
    width,
    height,
    accent,
    topBarHeight,
    bottomHairline,
    hairlineAlpha
  ); // <-- NUEVO

  // Título (opcional)
  if (showTitle) {
    drawTitle(ctx, title, width, pad, accent);
  }

  // Fila de iconos centrada horizontalmente respecto al contenido disponible
  const contentW = cols * (iconSize + pad) - pad;
  let startX = Math.max(pad, Math.floor((width - contentW) / 2));
  const y = pad + titleBlockH;

  icons.forEach((ic) => {
    drawIcon(
      ctx,
      startX,
      y,
      iconSize,
      ic.img,
      showLabels ? ic.label : undefined
    );
    startX += iconSize + pad;
  });

  const tEncodeStart = performance.now();
  const buffer = await canvas.encode('png');
  const encodeMs = Math.round(performance.now() - tEncodeStart);

  return { buffer, encodeMs, width, height };
}
