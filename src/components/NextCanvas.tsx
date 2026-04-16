import { useEffect, useRef } from 'react';
import { MINI, NEXT_VISIBLE } from '../engine/constants';
import { PIECES } from '../engine/pieces';
import { drawBlock } from '../utils/canvasDraw';
import type { PieceKey } from '../engine/types';
import type { Theme } from '../themes/types';

interface Props {
  queue: PieceKey[];
  theme: Theme;
}

const SLOT = 4.5; // slots per piece in MINI units
const W    = 4 * MINI + MINI;
const H    = Math.ceil(SLOT * NEXT_VISIBLE * MINI);

export function NextCanvas({ queue, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const show = queue.slice(0, NEXT_VISIBLE);
    show.forEach((key, i) => {
      const def  = PIECES[key];
      const m    = def.shapes[0];
      const size = m.length;
      const offX = Math.floor((W / MINI - size) / 2);
      const offY = Math.round(i * SLOT) + Math.floor((SLOT - size) / 2);
      const color = theme.tetrominoColors[key];

      for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
          if (!m[y][x]) continue;
          drawBlock(ctx, offX + x, offY + y, MINI, color, theme.blockStyle);
        }
      }
    });
  }, [queue, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block' }}
      aria-label="Next pieces"
    />
  );
}
