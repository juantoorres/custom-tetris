import { useRef, useCallback, useReducer } from 'react';
import type { GameState, GameMode, Piece, PieceKey } from '../engine/types';
import { DROP_INTERVALS, SOFT_DROP_PTS, HARD_DROP_PTS, NEXT_VISIBLE } from '../engine/constants';
import {
  emptyBoard, validPos, calcGhost, spawnPiece,
  detectTSpin, lockPiece, clearLines, isPerfectClear, tryRotate,
} from '../engine/board';
import { processScore } from '../engine/scoring';
import { Bag } from '../engine/bag';
import type { AudioEngine } from '../utils/audioEngine';

// ─── State shape ────────────────────────────────────────────────────────────────

function makeInitialState(): GameState {
  return {
    board: emptyBoard(),
    current: { key: 'I', rot: 0, row: 0, col: 3 },
    ghost:   { key: 'I', rot: 0, row: 0, col: 3 },
    holdPiece: null,
    holdUsed: false,
    nextQueue: [],
    score: 0,
    lines: 0,
    combo: -1,
    backToBack: false,
    lastTSpin: false,
    phase: 'setup',
    difficulty: 1,
    mode: 'normal',
    elapsed: 0,
  };
}

// ─── Reducer actions ────────────────────────────────────────────────────────────

type Action =
  | { type: 'START'; difficulty: number; mode: GameMode; initialState: GameState }
  | { type: 'SET_STATE'; state: GameState }
  | { type: 'PHASE'; phase: GameState['phase'] };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START':      return action.initialState;
    case 'SET_STATE':  return action.state;
    case 'PHASE':      return { ...state, phase: action.phase };
    default:           return state;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export interface GameActions {
  startGame: (difficulty: number, mode: GameMode) => void;
  restartGame: () => void;
  move: (dc: number) => void;
  rotate: (dir: 1 | -1) => void;
  softDrop: () => void;
  hardDrop: () => void;
  holdAction: () => void;
  togglePause: () => void;
}

export function useGameEngine(getThemeColor: (key: PieceKey) => string, audio: AudioEngine) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState);
  const stateRef = useRef<GameState>(state);
  stateRef.current = state;

  const rafRef       = useRef<number>(0);
  const lastTimeRef  = useRef<number | null>(null);
  const dropTimerRef = useRef<number>(0);
  const bagRef       = useRef<Bag>(new Bag());
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── helpers ──────────────────────────────────────────────────────────────────

  const applyState = useCallback((next: GameState) => {
    stateRef.current = next;
    dispatch({ type: 'SET_STATE', state: next });
  }, []);

  const buildStart = useCallback((difficulty: number, mode: GameMode): GameState => {
    const bag = new Bag();
    bagRef.current = bag;
    const queue: PieceKey[] = [];
    bag.fill(queue, NEXT_VISIBLE + 1);
    const firstKey = queue.shift()!;
    const current = spawnPiece(firstKey, mode);
    const ghost   = calcGhost(emptyBoard(), current, mode);
    return {
      board: emptyBoard(),
      current,
      ghost,
      holdPiece: null,
      holdUsed: false,
      nextQueue: queue,
      score: 0,
      lines: 0,
      combo: -1,
      backToBack: false,
      lastTSpin: false,
      phase: 'playing',
      difficulty,
      mode,
      elapsed: 0,
    };
  }, []);

  // ── game loop ─────────────────────────────────────────────────────────────────

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const triggerGameOver = useCallback((s: GameState) => {
    stopLoop();
    audio.playGameOver();
    applyState({ ...s, phase: 'over' });
  }, [stopLoop, applyState, audio]);

  const doLock = useCallback((s: GameState): GameState | null => {
    const isTSpin  = detectTSpin(s.board, s.current);
    const color    = getThemeColor(s.current.key);
    const newBoard = lockPiece(s.board, s.current, color);
    if (!newBoard) return null; // game over

    const { board: clearedBoard, cleared } = clearLines(newBoard, s.mode);
    const isPerfect = isPerfectClear(clearedBoard);

    if (cleared > 0) {
      if (isPerfect) audio.playPerfectClear();
      else audio.playLineClear(Math.min(cleared, 4) as 1 | 2 | 3 | 4);
    } else {
      audio.playLock();
    }

    const scoreRes = processScore({
      cleared,
      isTSpin,
      isPerfect,
      combo: s.combo,
      backToBack: s.backToBack,
      difficulty: s.difficulty,
    });

    const queue = [...s.nextQueue];
    bagRef.current.fill(queue, NEXT_VISIBLE + 1);
    const nextKey = queue.shift()!;
    const nextPiece = spawnPiece(nextKey, s.mode);
    const nextGhost = calcGhost(clearedBoard, nextPiece, s.mode);

    // Check game over: new piece overlaps immediately
    if (!validPos(clearedBoard, nextPiece, 0, 0)) return null;

    return {
      ...s,
      board: clearedBoard,
      current: nextPiece,
      ghost: nextGhost,
      holdUsed: false,
      nextQueue: queue,
      score: s.score + scoreRes.scoreAdded,
      lines: s.lines + cleared,
      combo: scoreRes.newCombo,
      backToBack: scoreRes.newBackToBack,
      lastTSpin: scoreRes.newLastTSpin,
    };
  }, [getThemeColor]);

  const gameLoop = useCallback((ts: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;

    if (lastTimeRef.current === null) lastTimeRef.current = ts;
    const dt = ts - lastTimeRef.current;
    lastTimeRef.current = ts;

    dropTimerRef.current += dt;
    const interval = DROP_INTERVALS[s.difficulty] ?? 900;

    // accumulate game clock into ref (dispatched to React every second via timerRef interval)
    const withTime: GameState = { ...s, elapsed: s.elapsed + dt };
    stateRef.current = withTime;

    if (dropTimerRef.current >= interval) {
      dropTimerRef.current = 0;
      const dir = withTime.mode === 'inverted' ? -1 : 1;
      if (validPos(withTime.board, withTime.current, dir, 0)) {
        const updated: GameState = {
          ...withTime,
          current: { ...withTime.current, row: withTime.current.row + dir },
        };
        updated.ghost = calcGhost(updated.board, updated.current, updated.mode);
        applyState(updated);
      } else {
        const next = doLock(withTime);
        if (!next) { triggerGameOver(withTime); return; }
        applyState(next);
      }
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [applyState, doLock, triggerGameOver]);

  const startLoop = useCallback(() => {
    lastTimeRef.current = null;
    dropTimerRef.current = 0;
    stopLoop();
    rafRef.current = requestAnimationFrame(gameLoop);
    // push elapsed to React state every second so the timer display updates
    timerRef.current = setInterval(() => {
      const s = stateRef.current;
      if (s.phase === 'playing') {
        dispatch({ type: 'SET_STATE', state: stateRef.current });
      }
    }, 1000);
  }, [gameLoop, stopLoop]);

  // ── public actions ────────────────────────────────────────────────────────────

  const startGame = useCallback((difficulty: number, mode: GameMode) => {
    const s = buildStart(difficulty, mode);
    applyState(s);
    startLoop();
  }, [buildStart, applyState, startLoop]);

  const restartGame = useCallback(() => {
    const s = stateRef.current;
    startGame(s.difficulty, s.mode);
  }, [startGame]);

  const move = useCallback((dc: number) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    if (!validPos(s.board, s.current, 0, dc)) return;
    audio.playMove();
    const updated: GameState = {
      ...s,
      current: { ...s.current, col: s.current.col + dc },
    };
    updated.ghost = calcGhost(updated.board, updated.current, updated.mode);
    applyState(updated);
  }, [applyState]);

  const rotate = useCallback((dir: 1 | -1) => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    const rotated = tryRotate(s.board, s.current, dir);
    if (!rotated) return;
    audio.playRotate();
    const updated: GameState = { ...s, current: rotated };
    updated.ghost = calcGhost(updated.board, updated.current, updated.mode);
    applyState(updated);
  }, [applyState]);

  const softDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    const dir = s.mode === 'inverted' ? -1 : 1;
    if (validPos(s.board, s.current, dir, 0)) {
      audio.playSoftDrop();
      const updated: GameState = {
        ...s,
        current: { ...s.current, row: s.current.row + dir },
        score: s.score + SOFT_DROP_PTS,
      };
      updated.ghost = calcGhost(updated.board, updated.current, updated.mode);
      dropTimerRef.current = 0;
      applyState(updated);
    } else {
      const next = doLock(s);
      if (!next) { triggerGameOver(s); return; }
      dropTimerRef.current = 0;
      applyState(next);
    }
  }, [applyState, doLock, triggerGameOver]);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing') return;
    const dir = s.mode === 'inverted' ? -1 : 1;
    let dist = 0;
    let piece = { ...s.current };
    while (validPos(s.board, piece, dir, 0)) {
      piece = { ...piece, row: piece.row + dir };
      dist++;
    }
    const dropped: GameState = { ...s, current: piece, score: s.score + dist * HARD_DROP_PTS };
    audio.playHardDrop();
    const next = doLock(dropped);
    if (!next) { triggerGameOver(dropped); return; }
    dropTimerRef.current = 0;
    applyState(next);
  }, [applyState, doLock, triggerGameOver]);

  const holdAction = useCallback(() => {
    const s = stateRef.current;
    if (s.phase !== 'playing' || s.holdUsed) return;
    audio.playHold();
    const key = s.current.key;
    const queue = [...s.nextQueue];

    let nextPiece: Piece;
    if (s.holdPiece) {
      nextPiece = spawnPiece(s.holdPiece, s.mode);
    } else {
      bagRef.current.fill(queue, NEXT_VISIBLE + 1);
      const nextKey = queue.shift()!;
      nextPiece = spawnPiece(nextKey, s.mode);
    }

    const ghost = calcGhost(s.board, nextPiece, s.mode);
    const updated: GameState = {
      ...s,
      current: nextPiece,
      ghost,
      holdPiece: key,
      holdUsed: true,
      nextQueue: queue,
    };
    applyState(updated);
  }, [applyState]);

  const togglePause = useCallback(() => {
    const s = stateRef.current;
    if (s.phase === 'playing') {
      stopLoop();
      applyState({ ...s, phase: 'paused' });
    } else if (s.phase === 'paused') {
      lastTimeRef.current = null;
      const resumed = { ...s, phase: 'playing' as const };
      applyState(resumed);
      rafRef.current = requestAnimationFrame(gameLoop);
      timerRef.current = setInterval(() => {
        const cur = stateRef.current;
        if (cur.phase === 'playing') dispatch({ type: 'SET_STATE', state: stateRef.current });
      }, 1000);
    }
  }, [stopLoop, applyState, gameLoop]);

  const actions: GameActions = {
    startGame, restartGame, move, rotate, softDrop, hardDrop, holdAction, togglePause,
  };

  return { state, actions };
}
