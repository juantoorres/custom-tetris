import type { BlockStyle } from '../themes/types';

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  style: BlockStyle,
  alpha = 1,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;

  switch (style) {
    case 'glow': {
      ctx.shadowColor = color;
      ctx.shadowBlur  = 12;
      ctx.fillStyle   = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // inner bright core
      ctx.shadowBlur  = 0;
      ctx.fillStyle   = lighten(color, 0.45);
      ctx.fillRect(x * size + 4, y * size + 4, size - 8, size - 8);
      break;
    }
    case 'flat': {
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      break;
    }
    case 'retro': {
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // scanline overlay
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      for (let sy = y * size + 2; sy < y * size + size - 1; sy += 4) {
        ctx.fillRect(x * size + 1, sy, size - 2, 1);
      }
      // border
      ctx.strokeStyle = 'rgba(0,255,65,0.5)';
      ctx.lineWidth   = 1;
      ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
      break;
    }
    case 'gradient': {
      const grad = ctx.createLinearGradient(
        x * size, y * size,
        x * size + size, y * size + size,
      );
      grad.addColorStop(0, lighten(color, 0.3));
      grad.addColorStop(1, darken(color, 0.2));
      ctx.fillStyle = grad;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      break;
    }
    default: { // 'classic'
      ctx.fillStyle = color;
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      // highlight strip
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      break;
    }
  }

  ctx.restore();
}

export function drawGhostBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle   = color;
  ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 1;
  ctx.strokeRect(x * size + 1, y * size + 1, size - 2, size - 2);
  ctx.restore();
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function lighten(color: string, amt: number): string {
  try {
    const [r, g, b] = hexToRgb(color);
    const clamp = (v: number) => Math.min(255, Math.round(v + (255 - v) * amt));
    return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
  } catch { return color; }
}

function darken(color: string, amt: number): string {
  try {
    const [r, g, b] = hexToRgb(color);
    const clamp = (v: number) => Math.max(0, Math.round(v * (1 - amt)));
    return `rgb(${clamp(r)},${clamp(g)},${clamp(b)})`;
  } catch { return color; }
}
