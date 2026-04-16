export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30; // px per cell on the main board
export const MINI  = 20; // px per cell on hold/next canvases

export const DROP_INTERVALS: Record<number, number> = {
  1: 900,
  2: 600,
  3: 380,
  4: 220,
  5: 90,
};

export const DIFF_MULTIPLIER: Record<number, number> = {
  1: 1,
  2: 1.2,
  3: 1.5,
  4: 2,
  5: 3,
};

// Points for 0-4 lines cleared at once
export const LINE_SCORES   = [0, 100, 300, 500, 800] as const;
// Points for T-spin with 0-2 lines
export const TSPIN_SCORES  = [0, 400, 700] as const;
export const PERFECT_CLEAR = 2000;
export const SOFT_DROP_PTS = 1;
export const HARD_DROP_PTS = 2;
export const BACK2BACK_MULT = 1.5;
export const COMBO_BONUS_PER = 50;

export const NEXT_VISIBLE = 5;
