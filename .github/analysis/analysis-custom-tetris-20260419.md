# Deep Analysis — `custom-tetris`

**Date:** 2026-04-19  
**Analyst:** tetris-expert agent  
**Scope:** Full codebase — game loop, React performance, Tetris Guideline mechanics, architecture

---

## Section 1 — Game Loop Accuracy

**File:** `src/hooks/useGameEngine.ts`

### ✅ Delta-time correctness
`lastTimeRef.current = null` is set in `startLoop` (cold start) and in `togglePause` resume path. Inside `gameLoop`:

```ts
if (lastTimeRef.current === null) lastTimeRef.current = ts;
const dt = ts - lastTimeRef.current;   // dt = 0 on first frame
lastTimeRef.current = ts;
```

`dt` is always 0 on the first frame after a reset. No spike possible. **Correct.**

### ✅ 60 FPS budget
Every frame:
- One spread of `stateRef.current` into `withTime` → O(1)
- `stateRef.current = withTime` → O(1), no React dispatch
- `applyState` (React dispatch) only called when the gravity interval fires — at most once per `DROP_INTERVAL` ms, not every frame

No O(n²) board scans or canvas operations inside the rAF callback. **Correct.**

### ✅ Timer dispatch frequency
`timerRef` is cleared in `stopLoop`, which is called on pause, game-over, and restart. A fresh interval is re-created in `startLoop` and in the `togglePause` resume branch. The interval only dispatches when `phase === 'playing'`. **Correct.**

### 🟡 Gravity model — Guideline deviation
`DROP_INTERVALS` maps difficulty 1–5 to fixed ms buckets (900 → 90). The Guideline specifies a continuous level-gravity curve:

$$G(n) = (0.8 - (n-1) \times 0.007)^{(n-1)} \text{ s/cell}$$

This is a cosmetic/feel deviation, not a bug. Recommend adding an optional `levelGravity(level: number)` export to `constants.ts` for future use.

### 🔴 Lock delay — ABSENT
```ts
// gameLoop — gravity tick, piece can't fall:
const next = doLock(withTime);
```

Pieces lock **instantly** on the gravity tick where downward movement fails. The Guideline requires:
- **500 ms** lock-delay timer
- Timer **resets** on every valid move or rotate during the delay
- Maximum **15 resets** (move-reset rule), after which the piece locks regardless

Fix requires adding `lockDelayRef: useRef<number>(0)` and `moveResetCountRef: useRef<number>(0)` alongside `dropTimerRef`, and transitioning the loop into a lock-delay phase instead of calling `doLock` immediately.

---

## Section 2 — React Performance

**Files:** `src/App.tsx`, `src/hooks/useGameEngine.ts`, `src/components/*.tsx`

### ✅ `applyState` call frequency
React `dispatch` is called:
1. At most once per gravity tick (bounded by `DROP_INTERVALS`)
2. Once per second via `timerRef` interval (for elapsed display)
3. Once per player action (`move`, `rotate`, `hardDrop`, etc.)

Never called per rAF frame. **Correct.**

### ✅ `getThemeColor` stability — `App.tsx` lines 22–24
```ts
const getThemeColor = useCallback(
  (key: PieceKey) => theme.tetrominoColors[key],
  [theme],
);
```
Stable reference, only recreated when `theme` changes. **Correct.**

### ✅ Canvas isolation
All three canvas components draw exclusively inside `useEffect`:
- `BoardCanvas` — `useEffect([state, theme])` ✅
- `HoldCanvas` — `useEffect([pieceKey, theme, dimmed])` ✅
- `NextCanvas` — `useEffect([queue, theme])` ✅

No drawing in the game loop or outside `useEffect`. **Correct.**

### ✅ `stateRef` vs `state` in action callbacks
Every action (`move`, `rotate`, `softDrop`, `hardDrop`, `holdAction`, `togglePause`) opens with:
```ts
const s = stateRef.current;
```
No stale-closure risk. **Correct.**

### 🟡 `audio` missing from `useCallback` dependency arrays
`audio` (the `AudioEngine` instance) is used inside `doLock`, `move`, `rotate`, `softDrop`, `hardDrop`, `holdAction`, and `triggerGameOver` — but only `triggerGameOver` correctly lists it in deps:

```ts
const doLock = useCallback((...) => {
  ...
  audio.playLock();      // audio captured but NOT in deps
  ...
}, [getThemeColor]);     // ← should be [getThemeColor, audio]

const move = useCallback((dc: number) => {
  ...
  audio.playMove();
}, [applyState]);         // ← should be [applyState, audio]
```

Harmless in practice since `audioRef.current` is a stable reference, but `eslint-plugin-react-hooks` exhaustive-deps will flag all of these.

---

## Section 3 — Tetris Guideline Mechanics

### 3a. Wall Kicks / SRS — 🔴 Critical deviation

Current kick table in `src/engine/board.ts` (line ~127):
```ts
const kicks: [number, number][] = [[0,0],[0,-1],[0,1],[0,-2],[0,2]];
//                                   [dr,  dc ]
```

**Problems:**
1. **Only column offsets** — `dr` is always 0. SRS requires both row and column displacement (e.g., the "up kick" enabling T-spin doubles needs `dr = -1`).
2. **Symmetric and direction-agnostic** — SRS offsets differ between `0→R`, `R→0`, `R→2`, etc. The same 5 offsets are used for all 8 transitions.
3. **No separate I-piece table** — The I piece has different offsets from J/L/S/T/Z. The current code uses the same kicks for all pieces.
4. **O piece not guarded** — `PIECES.O.shapes` has 1 entry, so `newRot` is always 0, and `tryRotate` returns the O piece with a column kick applied. O should never rotate (return `null` immediately).

**Canonical SRS kicks for J/L/S/T/Z (0→R example):**

| Kick # | dc | dr |
|--------|----|----|
| 0 | 0 | 0 |
| 1 | -1 | 0 |
| 2 | -1 | +1 |
| 3 | 0 | -2 |
| 4 | -1 | -2 |

The missing row offsets (+1, -2) are exactly what enables T-spin setups.

---

### 3b. T-Spin Detection — two 🟡 Warnings

**`src/engine/board.ts`, `detectTSpin` (lines ~50–59):**

The 3-corner rule is implemented with correct corner coordinates:
```ts
const corners: [number, number][] = [
  [piece.row,     piece.col],
  [piece.row,     piece.col + 2],
  [piece.row + 2, piece.col],
  [piece.row + 2, piece.col + 2],
];
```
This is correct. However:

**Missing: last-action guard** (🟡 Warning)
`detectTSpin` is called inside `doLock` regardless of what input caused the lock. The Guideline requires the last input to have been a **rotation**. A T piece locked by gravity with 3 corners filled should not award a T-Spin. Fix: pass a `lastAction: 'rotate' | 'other'` flag and return `false` unless `lastAction === 'rotate'`.

**Missing: T-Spin Mini distinction** (🟡 Warning)
The Guideline distinguishes T-Spin Mini (only the 2 "back" corners of the T are filled, not both "front" corners) from a full T-Spin. T-Spin Mini awards halved scores (e.g., T-Spin Mini Single = 200 vs. T-Spin Single = 800). Current implementation awards full T-Spin for both cases.

---

### 3c. T-Spin Scoring — 🟡 Warnings

**`src/engine/scoring.ts`:**

**T-Spin Zero not scored (🟡)**
```ts
if (cleared === 0) {
  return { scoreAdded: 0, ... };   // early exit — T-Spin with 0 lines = 0 pts
}
```
The Guideline awards **400 points** for a T-Spin with no lines cleared. Fix: check `isTSpin && cleared === 0` before the early exit.

**T-Spin Triple under-scored (🟡)**
`TSPIN_SCORES = [0, 400, 700]` — index `Math.min(cleared, 2)` means a T-Spin Triple (3 lines) uses index 2 = **700 pts**. The Guideline awards **1600 pts** for T-Spin Triple. Fix: extend to `[400, 800, 1200, 1600]` for 0/1/2/3 cleared lines respectively.

---

### 3d. 7-Bag and Line Clear — ✅

**`src/engine/bag.ts`:**
`shuffle()` is a correct Fisher-Yates in-place shuffle. `Bag.fill()` refills before each draw. In `doLock`:
```ts
bagRef.current.fill(queue, NEXT_VISIBLE + 1);  // ensure 6 in queue
const nextKey = queue.shift()!;                  // draw 1, leaving 5
```
Queue invariant (`≥ NEXT_VISIBLE`) is maintained on every spawn. **Correct.**

**`src/engine/board.ts`, `clearLines`:**
Normal mode: iterates bottom-to-top (`r--`), splices, unshifts empty row, does `r++` to recheck the new row at position `r`. ✅
Inverted mode: iterates top-to-bottom (`r++`), splices, pushes empty row at bottom, does `r--` to recheck. ✅
Splice index is correctly compensated in both modes. **Correct.**

---

## Section 4 — Code Architecture

**Files:** all `src/` directories

### ✅ Engine purity
`board.ts`, `pieces.ts`, `bag.ts`, `scoring.ts`, `types.ts`, `constants.ts` — zero React imports. All exports are pure functions or plain classes. **Clean.**

### ✅ Hook boundary
`useGameEngine` is the sole bridge between engine and React. No component imports directly from `src/engine/` to mutate state.

### ✅ Audio isolation
`AudioEngine` instantiated once via `useRef(new AudioEngine())` in `App.tsx`. No re-creation on re-renders.

### ✅ Theme/color separation
`src/engine/pieces.ts` explicitly states colors are not stored there:
```ts
// Colors are NOT stored here; they are supplied by the active theme at render time.
```
`PieceDef` has no `color` field. Theme colors flow in only at `getThemeColor()` call time. **Clean.**

### ✅ Single-responsibility canvas components
`BoardCanvas`, `HoldCanvas`, `NextCanvas` — all exclusively receive props and draw. No state mutation, no scoring, no game logic.

### ✅ CSS custom properties
Canvas background and grid colors read from `theme.cssVars['--canvas-bg']`/`'--canvas-grid']`. Canvas border uses `var(--border)`. No hardcoded hex values in component styles.

---

## Summary Report

| # | File | Finding | Severity | Fix |
|---|------|---------|----------|-----|
| 1 | `src/engine/board.ts` L124–133 | `tryRotate` uses symmetric horizontal-only kicks — no row offsets, no per-transition asymmetry, no separate I-piece table. T-spin doubles impossible. | 🔴 Critical | Replace with canonical SRS 8-transition tables for J/L/S/T/Z and separate I table |
| 2 | `src/hooks/useGameEngine.ts` (gameLoop) | No lock delay — piece locks instantly on failed gravity tick. No move-reset counter. | 🔴 Critical | Add `lockDelayRef` (500 ms) + `moveResetCountRef` (cap 15); call `doLock` only after delay expires |
| 3 | `src/engine/board.ts` L50–59 | `detectTSpin` has no last-action-was-rotate guard | 🟡 Warning | Pass `lastAction` flag; return `false` unless `'rotate'` |
| 4 | `src/engine/board.ts` L50–59 | No T-Spin Mini distinction (back vs. front corner rule) | 🟡 Warning | Add Mini detection; award separate `TSPIN_MINI_SCORES` |
| 5 | `src/engine/scoring.ts` L27–28 | T-Spin Zero (0 lines cleared) awards 0 pts instead of Guideline 400 | 🟡 Warning | Move T-Spin Zero scoring out of `cleared === 0` early exit |
| 6 | `src/engine/scoring.ts` | T-Spin Triple scored at 700 instead of Guideline 1600 | 🟡 Warning | Extend `TSPIN_SCORES` to `[400, 800, 1200, 1600]` |
| 7 | `src/engine/constants.ts` L5–11 | Bucket-based gravity vs. Guideline continuous level formula | 🟡 Warning | Add `levelGravity(n: number)` export alongside existing buckets |
| 8 | `src/hooks/useGameEngine.ts` | `audio` used in 5+ `useCallback` closures but missing from their dep arrays | 🟡 Warning | Add `audio` to all affected `useCallback` dep arrays |
| 9 | `src/engine/board.ts` L122–133 | O-piece not guarded — `tryRotate` can return an O with a kick offset applied | 🟢 Info | Early-return `null` when `piece.key === 'O'` |

---

## Overall Scores

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Guideline compliance** | **4 / 10** | Lock delay absent, SRS kicks simplified, T-Spin scoring has 3 gaps, Mini not distinguished, gravity is bucket-based |
| **React performance** | **8 / 10** | `dispatch` frequency correct, `getThemeColor` memoized, canvas isolation perfect, `useEffect` deps correct. Deduction: `audio` missing from 5+ dep arrays |
| **Architecture** | **9 / 10** | Engine is pure, hook boundary clean, single-responsibility components, theme/color separation enforced. Near-perfect separation of concerns |

---

## Top 3 Recommended Next Steps

### 1. Implement canonical SRS kick tables (Finding #1)
Highest gameplay impact. Enables T-spin setups, I-piece wall kicks, and proper feel. Replace the 5 symmetric horizontal kicks in `tryRotate` with the 8 per-transition arrays for J/L/S/T/Z and the separate I-piece table. Add the O-piece guard as a one-liner.

### 2. Add 500 ms lock delay with 15-reset move-reset rule (Finding #2)
The most noticeable behavioural difference from official Tetris. Without it, pieces lock the instant gravity fires — skilled players expect time to slide/rotate after landing. Requires `lockDelayRef` + `moveResetCountRef`, resetting both on every valid `move` or `rotate` input.

### 3. Fix T-Spin scoring: T-Spin Zero + T-Spin Triple + last-action guard (Findings #3, #5, #6)
Three focused changes: extend `TSPIN_SCORES` to `[400, 800, 1200, 1600]`, move the T-Spin Zero case out of the `cleared === 0` early exit, and thread a `lastAction` flag through `doLock → detectTSpin`. These are all isolated and can be done in a single commit.
