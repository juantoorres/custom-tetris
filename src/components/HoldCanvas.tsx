import { useEffect, useRef } from 'react';
import { MINI } from '../engine/constants';
import { PIECES } from '../engine/pieces';
import { drawBlock } from '../utils/canvasDraw';
import type { PieceKey } from '../engine/types';
import type { Theme } from '../themes/types';

interface Props {
  pieceKey: PieceKey | null;
  theme: Theme;
  dimmed?: boolean;
}

const W = 4 * MINI + MINI;
const H = 4 * MINI + MINI;

export function HoldCanvas({ pieceKey, theme, dimmed }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    if (!pieceKey) return;

    const def  = PIECES[pieceKey];
    const m    = def.shapes[0];
    const size = m.length;
    const offX = Math.floor((W / MINI - size) / 2);
    const offY = Math.floor((H / MINI - size) / 2);
    const color = theme.tetrominoColors[pieceKey];

    for (let y = 0; y < m.length; y++) {
      for (let x = 0; x < m[y].length; x++) {
        if (!m[y][x]) continue;
        drawBlock(ctx, offX + x, offY + y, MINI, color, theme.blockStyle, dimmed ? 0.4 : 1);
      }
    }
  }, [pieceKey, theme, dimmed]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      style={{ display: 'block' }}
      aria-label="Held piece"
    />
  );
}
