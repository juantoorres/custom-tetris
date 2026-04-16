import {
  LINE_SCORES,
  TSPIN_SCORES,
  PERFECT_CLEAR,
  BACK2BACK_MULT,
  COMBO_BONUS_PER,
  DIFF_MULTIPLIER,
} from './constants';

export interface ScoreResult {
  scoreAdded: number;
  newBackToBack: boolean;
  newCombo: number;
  newLastTSpin: boolean;
}

export function processScore(params: {
  cleared: number;
  isTSpin: boolean;
  isPerfect: boolean;
  combo: number;
  backToBack: boolean;
  difficulty: number;
}): ScoreResult {
  const { cleared, isTSpin, isPerfect, combo, backToBack, difficulty } = params;
  const mult = DIFF_MULTIPLIER[difficulty] ?? 1;

  if (cleared === 0) {
    return { scoreAdded: 0, newBackToBack: false, newCombo: -1, newLastTSpin: false };
  }

  const newCombo = combo + 1;
  const isHighValue = isTSpin || cleared === 4;

  const base = isTSpin
    ? TSPIN_SCORES[Math.min(cleared, 2) as 0 | 1 | 2]
    : LINE_SCORES[Math.min(cleared, 4) as 0 | 1 | 2 | 3 | 4];

  const b2bMult = isHighValue && backToBack ? BACK2BACK_MULT : 1;
  const comboBonus = newCombo > 0 ? COMBO_BONUS_PER * newCombo : 0;
  const perfBonus  = isPerfect ? PERFECT_CLEAR : 0;

  const scoreAdded = Math.round((base * b2bMult + comboBonus + perfBonus) * mult);

  return {
    scoreAdded,
    newBackToBack: isHighValue,
    newCombo,
    newLastTSpin: isTSpin,
  };
}
