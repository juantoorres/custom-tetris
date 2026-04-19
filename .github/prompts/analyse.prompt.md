---
mode: agent
description: Deep-dive analysis of the custom-tetris codebase. Checks game loop accuracy, React performance, Tetris Guideline mechanics, and architecture.
---

Perform a thorough engineering analysis of this Tetris codebase. Work through each section below in order. For every finding, state: **file + line range → issue → severity (🔴 Critical / 🟡 Warning / 🟢 Info) → recommended fix**.

---

## 1. Game Loop Accuracy

Examine `src/hooks/useGameEngine.ts`.

**Check for:**

- **Delta-time correctness** — Is `dt = ts - lastTimeRef.current` computed every frame before any game logic? Is `lastTimeRef` correctly reset to `null` on game start and on resume from pause to prevent a single giant `dt` spike?
- **60 FPS budget** — Does any synchronous work inside the rAF callback risk exceeding ~16 ms? Flag any O(n²) board scans or canvas operations called from the loop.
- **Timer dispatch frequency** — The `setInterval` that pushes `elapsed` to React state must fire at most once per second. Confirm it is cleared in `stopLoop` and re-created in `startLoop`/`togglePause` resume path.
- **Gravity model** — Drop speed is keyed off `DROP_INTERVALS[difficulty]`. Note this is a fixed-bucket model, not the Guideline's level-based formula `(0.8 - (level-1)*0.007)^(level-1)`. Report as a Guideline deviation.
- **Lock delay** — Is there a lock-delay timer? If pieces lock instantly on the gravity tick where downward movement fails, flag as **🔴 Critical** Guideline deviation and describe the required `lockDelayRef` + `moveResetCountRef` implementation.

---

## 2. React Performance

Examine `src/App.tsx`, `src/hooks/useGameEngine.ts`, and all files in `src/components/`.

**Check for:**

- **Unnecessary re-renders** — Does `useGameEngine` call `dispatch` (via `applyState`) more often than required? Every `applyState` call re-renders the entire component tree. Identify any paths where state is dispatched with no meaningful change.
- **`getThemeColor` stability** — In `App.tsx`, is `getThemeColor` wrapped in `useCallback` with `[theme]` as its sole dependency? If not, a new function reference is created every render, invalidating `useGameEngine`'s `doLock` closure.
- **Canvas isolation** — Confirm that `BoardCanvas`, `HoldCanvas`, and `NextCanvas` are the **only** components that call `canvas.getContext('2d')`. Any drawing logic outside a `useEffect` in these components is a bug.
- **`useEffect` dependency arrays** — In canvas components, are `state` and `theme` both listed as dependencies? A missing dependency causes stale renders; an extra one causes excess redraws.
- **`stateRef` vs `state`** — The game loop reads `stateRef.current` (bypassing React) to avoid closure staleness. Confirm every action callback (`move`, `rotate`, `softDrop`, etc.) reads from `stateRef.current`, not the closed-over `state` from `useReducer`.

---

## 3. Tetris Guideline Mechanics

Examine `src/engine/board.ts`, `src/engine/pieces.ts`, `src/engine/bag.ts`, and `src/hooks/useGameEngine.ts`.

### 3a. Wall Kicks / Super Rotation System (SRS)

- Print the kick offsets currently used in `tryRotate`.
- Compare them against the canonical SRS tables:
  - **J/L/S/T/Z** use asymmetric per-transition offsets (8 transition pairs, 5 offsets each).
  - **I piece** has its own separate offset table.
  - **O piece** does not rotate.
- Flag any deviation from the canonical tables. Simplified symmetric kicks (`[0,0],[0,-1],[0,1],[0,-2],[0,2]`) fail known SRS test cases (e.g. the T-spin double setup).

### 3b. T-Spin Detection

- Inspect `detectTSpin` in `src/engine/board.ts`.
- Verify the **3-corner rule** is implemented correctly: ≥3 of the 4 corners of the T's 3×3 bounding box must be occupied.
- Check whether the **last-action guard** is present: a T-Spin is only valid if the last input was a rotation (not a move or gravity drop). If missing, flag as **🟡 Warning**.
- Check whether **T-Spin Mini** (only the 2 "back" corners occupied, not both "front" corners) is distinguished from a full T-Spin. Missing distinction causes over-awarding of full T-Spin scores.

### 3c. Random Generator (7-Bag)

- Inspect `src/engine/bag.ts`.
- Confirm the shuffle is a proper Fisher-Yates in-place shuffle.
- Confirm `Bag.fill()` is called **before** `queue.shift()` during piece spawning so the queue never drops below `NEXT_VISIBLE`.
- Check whether the queue can ever be empty between a piece lock and the next spawn.

### 3d. Line Clear Logic

- Inspect `clearLines` in `src/engine/board.ts`.
- For **Normal mode**: completed rows must be removed and an empty row prepended (rows shift down visually).
- For **Inverted mode**: completed rows must be removed and an empty row appended (rows shift up visually).
- Verify the loop index is adjusted (`r--` / `r++`) after a splice to avoid skipping rows.

---

## 4. Code Architecture

Examine the full `src/` directory structure.

**Check for:**

- **Engine purity** — Files in `src/engine/` must contain zero React imports. Any `useState`, `useRef`, or JSX in engine files is a violation.
- **Hook boundary** — `src/hooks/useGameEngine.ts` is the single allowed bridge between the pure engine and React. Confirm no component imports directly from `src/engine/board.ts` to mutate state.
- **Audio isolation** — `src/utils/audioEngine.ts` must not import from engine or React modules. It is a standalone Web Audio utility. Confirm `AudioEngine` is instantiated once in `App.tsx` via `useRef`, not re-created on re-renders.
- **Theme/color separation** — Tetromino colors must **not** be hardcoded in `src/engine/pieces.ts`. Colors belong exclusively in `src/themes/themes.ts` and are passed to canvas draw calls via the `theme` prop. Flag any `color` field in piece definitions.
- **Single-responsibility components** — Each canvas component (`BoardCanvas`, `HoldCanvas`, `NextCanvas`) should do nothing except receive props and draw. State mutation, scoring, or game logic inside a component is a violation.
- **CSS custom properties** — All visual tokens must be CSS custom properties (`--accent`, `--bg`, etc.) set by `ThemeProvider` on `:root`. Hardcoded hex values in component `style` attributes (other than one-off layout values) should be flagged.

---

## 5. Summary Report

After completing all sections, output a prioritised table:

| # | File | Finding | Severity | Fix |
|---|------|---------|----------|-----|
| 1 | … | … | 🔴/🟡/🟢 | … |

Then give an overall verdict:

- **Guideline compliance score** (0–10): how closely the engine follows official Tetris Guideline rules.
- **React performance score** (0–10): absence of unnecessary renders and correct hook usage.
- **Architecture score** (0–10): cleanliness of the engine/hook/component boundary.
- **Top 3 recommended next steps** in order of impact.
