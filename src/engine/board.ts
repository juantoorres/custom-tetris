import type { BoardCell, Piece, GameMode } from './types';
import { COLS, ROWS } from './constants';
import { getMatrix, PIECES } from './pieces';

export function emptyBoard(): BoardCell[][] {
  return Array.from({ length: ROWS }, () => Array<BoardCell>(COLS).fill(null));
}

export function validPos(
  board: BoardCell[][],
  piece: Piece,
  dr: number,
  dc: number,
  rot?: number,
): boolean {
  const r = rot !== undefined ? rot : piece.rot;
  const def = PIECES[piece.key];
  const m = def.shapes[r % def.shapes.length];
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const nr = piece.row + y + dr;
      const nc = piece.col + x + dc;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) return false;
      if (board[nr][nc]) return false;
    }
  }
  return true;
}

export function calcGhost(board: BoardCell[][], current: Piece, mode: GameMode): Piece {
  const dir = mode === 'inverted' ? -1 : 1;
  let ghost = { ...current };
  while (validPos(board, ghost, dir, 0)) {
    ghost = { ...ghost, row: ghost.row + dir };
  }
  return ghost;
}

export function spawnPiece(key: Piece['key'], mode: GameMode): Piece {
  const def = PIECES[key];
  const size = def.shapes[0].length;
  const col  = Math.floor((COLS - size) / 2);
  const row  = mode === 'inverted' ? ROWS - size : 0;
  return { key, rot: 0, row, col };
}

export function detectTSpin(board: BoardCell[][], piece: Piece): boolean {
  if (piece.key !== 'T') return false;
  const corners: [number, number][] = [
    [piece.row,     piece.col],
    [piece.row,     piece.col + 2],
    [piece.row + 2, piece.col],
    [piece.row + 2, piece.col + 2],
  ];
  let filled = 0;
  for (const [r, c] of corners) {
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[r][c]) filled++;
  }
  return filled >= 3;
}

/**
 * Locks the current piece into the board. Returns the modified board (mutated clone)
 * or null if the lock causes an out-of-bounds (game over).
 */
export function lockPiece(
  board: BoardCell[][],
  piece: Piece,
  color: string,
): BoardCell[][] | null {
  const m = getMatrix(piece);
  const next = board.map(r => [...r]);
  for (let y = 0; y < m.length; y++) {
    for (let x = 0; x < m[y].length; x++) {
      if (!m[y][x]) continue;
      const r = piece.row + y;
      const c = piece.col + x;
      if (r < 0 || r >= ROWS) return null;
      next[r][c] = color;
    }
  }
  return next;
}

export function clearLines(board: BoardCell[][], mode: GameMode): { board: BoardCell[][]; cleared: number } {
  let next = board.map(r => [...r]);
  let cleared = 0;

  if (mode === 'inverted') {
    for (let r = 0; r < ROWS; r++) {
      if (next[r].every(c => c !== null)) {
        next.splice(r, 1);
        next.push(Array<BoardCell>(COLS).fill(null));
        cleared++;
        r--;
      }
    }
  } else {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (next[r].every(c => c !== null)) {
        next.splice(r, 1);
        next.unshift(Array<BoardCell>(COLS).fill(null));
        cleared++;
        r++;
      }
    }
  }
  return { board: next, cleared };
}

export function isPerfectClear(board: BoardCell[][]): boolean {
  return board.every(row => row.every(c => c === null));
}

export function tryRotate(
  board: BoardCell[][],
  piece: Piece,
  dir: 1 | -1,
): Piece | null {
  const def = PIECES[piece.key];
  const newRot = ((piece.rot + dir) % def.shapes.length + def.shapes.length) % def.shapes.length;
  const kicks: [number, number][] = [[0,0],[0,-1],[0,1],[0,-2],[0,2]];
  for (const [dr, dc] of kicks) {
    if (validPos(board, piece, dr, dc, newRot)) {
      return { ...piece, rot: newRot, row: piece.row + dr, col: piece.col + dc };
    }
  }
  return null;
}
