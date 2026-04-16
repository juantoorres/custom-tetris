import { useEffect, useRef } from 'react';
import { BLOCK, COLS, ROWS } from '../engine/constants';
import { getMatrix } from '../engine/pieces';
import { drawBlock, drawGhostBlock } from '../utils/canvasDraw';
import type { GameState } from '../engine/types';
import type { Theme } from '../themes/types';

interface Props {
  state: GameState;
  theme: Theme;
}

export function BoardCanvas({ state, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Clear ────────────────────────────────────────────────────────────────
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme.cssVars['--canvas-bg'] ?? '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ── Grid lines ───────────────────────────────────────────────────────────
    ctx.strokeStyle = theme.cssVars['--canvas-grid'] ?? '#111';
    ctx.lineWidth   = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(COLS * BLOCK, r * BLOCK); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, ROWS * BLOCK); ctx.stroke();
    }

    // ── Locked board ────────────────────────────────────────────────────────
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = state.board[r][c];
        if (cell) drawBlock(ctx, c, r, BLOCK, cell, theme.blockStyle);
      }
    }

    // ── Ghost ────────────────────────────────────────────────────────────────
    if (state.phase === 'playing' || state.phase === 'paused') {
      const gm = getMatrix(state.ghost);
      const ghostColor = theme.tetrominoColors[state.current.key];
      for (let y = 0; y < gm.length; y++) {
        for (let x = 0; x < gm[y].length; x++) {
          if (!gm[y][x]) continue;
          drawGhostBlock(
            ctx,
            state.ghost.col + x,
            state.ghost.row + y,
            BLOCK,
            ghostColor,
            theme.ghostAlpha,
          );
        }
      }

      // ── Active piece ────────────────────────────────────────────────────────
      const m = getMatrix(state.current);
      const color = theme.tetrominoColors[state.current.key];
      for (let y = 0; y < m.length; y++) {
        for (let x = 0; x < m[y].length; x++) {
          if (!m[y][x]) continue;
          drawBlock(ctx, state.current.col + x, state.current.row + y, BLOCK, color, theme.blockStyle);
        }
      }
    }

    // ── Pause overlay ────────────────────────────────────────────────────────
    if (state.phase === 'paused') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle    = theme.cssVars['--text'] ?? '#fff';
      ctx.font         = `bold 28px ${theme.cssVars['--font-heading'] ?? 'sans-serif'}`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      if (theme.blockStyle === 'glow') {
        ctx.shadowColor = theme.cssVars['--accent'] ?? '#fff';
        ctx.shadowBlur  = 18;
      }
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.shadowBlur = 0;
    }
  }, [state, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={COLS * BLOCK}
      height={ROWS * BLOCK}
      style={{ border: `2px solid var(--border)`, borderRadius: 4, display: 'block' }}
      aria-label="Tetris board"
    />
  );
}
