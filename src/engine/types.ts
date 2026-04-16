export type PieceKey = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type GameMode = 'normal' | 'inverted';
export type GamePhase = 'setup' | 'playing' | 'paused' | 'over';

export interface Piece {
  key: PieceKey;
  rot: number;
  row: number;
  col: number;
}

export type BoardCell = string | null; // color string or null

export interface GameState {
  board: BoardCell[][];
  current: Piece;
  ghost: Piece;
  holdPiece: PieceKey | null;
  holdUsed: boolean;
  nextQueue: PieceKey[];
  score: number;
  lines: number;
  combo: number;
  backToBack: boolean;
  lastTSpin: boolean;
  phase: GamePhase;
  difficulty: number;
  mode: GameMode;
  elapsed: number; // ms — game clock, paused when phase !== 'playing'
}
