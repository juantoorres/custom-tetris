import type { PieceKey } from '../engine/types';

export type BlockStyle = 'classic' | 'flat' | 'glow' | 'retro' | 'gradient';

export interface Theme {
  id: string;
  label: string;
  /** CSS custom properties written to :root */
  cssVars: Record<string, string>;
  /** Per-piece fill colors (fully overridden by theme) */
  tetrominoColors: Record<PieceKey, string>;
  /** How blocks are drawn on the canvas */
  blockStyle: BlockStyle;
  /** Ghost opacity (0–1) */
  ghostAlpha: number;
}
