# 🟦 Tetris — React 18 + TypeScript + Vite

A fully-featured, single-file Tetris implementation built with **React 18**, **TypeScript**, and **Vite**. All game assets, logic, and styles are bundled into a single self-contained `dist/index.html` — no server required, just open the file.

---

## ✨ Features

### 🎮 Game Mechanics
- **7-bag randomizer** — fair piece distribution following official Tetris guidelines
- **Ghost piece** — shows where the current piece will land
- **Hold** — swap the current piece with a reserved one (once per piece)
- **Next queue** — preview the next 5 upcoming pieces
- **Soft drop** & **hard drop** — with bonus points for each
- **Wall-kick rotation** — pieces shift to accommodate tight spaces
- **T-Spin detection** — bonus scoring for spinning a T-piece into a gap
- **Back-to-back bonus** — 1.5× multiplier for consecutive Tetris/T-Spin clears
- **Combo multiplier** — rewards consecutive line clears
- **Perfect clear** — massive bonus for clearing the entire board

### 🕹️ Game Modes
| Mode | Description |
|------|-------------|
| **Normal ↓** | Classic Tetris — pieces fall from the top |
| **Inverted ↑** | Pieces spawn at the bottom and rise upward; lines clear from the top |

### ⚡ Difficulty Levels
| Level | Drop Speed |
|-------|-----------|
| 1 — Easy | 900 ms/drop |
| 2 | 600 ms/drop |
| 3 | 380 ms/drop |
| 4 | 220 ms/drop |
| 5 — Hard | 90 ms/drop |

### 🎨 6 Runtime-Switchable Themes
All themes recolor the full UI **and** all 7 tetromino block colors. Switch at any time via the **⚙ button** (top-right) — even mid-game.

| Theme | Vibe | Block Style |
|-------|------|-------------|
| **Classic** | Dark navy + purple accents | White highlight strip |
| **Retro** | Black + green phosphor, monospace | Scanline overlay |
| **Neon** | Pitch black + electric colors | Canvas `shadowBlur` glow |
| **Minimal** | Light gray + pastel pieces | Flat, no highlight |
| **Ocean** | Deep teal + aqua | Gradient fill |
| **Sunset** | Dark warm + orange/pink | Gradient fill |

### 🔊 Procedural Sound Effects
All sounds are synthesized with the **Web Audio API** — no external audio files needed.

| Event | Sound |
|-------|-------|
| Move ← → | Short square-wave tick |
| Rotate | Higher-pitched tick |
| Hold | Two-note chime |
| Soft drop | Descending sine blip |
| Hard drop | Noise burst + low thud |
| Lock | Noise thud |
| 1–3 lines cleared | Ascending tone sequence |
| Tetris (4 lines) | 4-note fanfare arpeggio |
| Perfect clear | 5-note rising fanfare |
| Game over | 5-note descending melody |

Toggle sounds with the **🔊/🔇 button** (top-left).

### ⏱️ Live Game Timer
- Tracks elapsed game time in real time
- Pauses when the game is paused
- Displayed in the side panel during play and shown in the Game Over screen

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `← →` | Move piece left / right |
| `↑` | Rotate clockwise |
| `Z` | Rotate counter-clockwise |
| `↓` | Soft drop |
| `Space` | Hard drop |
| `C` | Hold piece |
| `P` | Pause / Resume |

When **paused**, a **← Menu** button appears to return to the setup screen.

---

## 🏗️ Project Structure

```
src/
├── engine/
│   ├── types.ts        # GameState, Piece, GameMode, GamePhase types
│   ├── constants.ts    # Drop speeds, scoring constants
│   ├── pieces.ts       # 7 tetromino shape matrices (color-free)
│   ├── board.ts        # validPos, ghost, lock, clearLines, T-spin, wall-kick
│   ├── scoring.ts      # Pure processScore function
│   └── bag.ts          # 7-bag randomizer
├── themes/
│   ├── types.ts        # Theme interface
│   └── themes.ts       # 6 theme definitions
├── context/
│   └── ThemeContext.tsx # ThemeProvider + useTheme hook
├── hooks/
│   ├── useGameEngine.ts # Full rAF game loop + all actions
│   └── useKeyboard.ts   # Keyboard bindings
├── utils/
│   ├── canvasDraw.ts    # drawBlock (5 render styles), drawGhostBlock
│   └── audioEngine.ts   # Web Audio synthesizer
├── components/
│   ├── BoardCanvas.tsx  # Main 300×600 Canvas (redraws on state+theme)
│   ├── HoldCanvas.tsx   # Hold piece mini canvas
│   ├── NextCanvas.tsx   # 5-piece next queue canvas
│   ├── SetupScreen.tsx  # Difficulty + mode selection
│   ├── GameScreen.tsx   # Layout: panels + board
│   ├── Overlay.tsx      # Game over modal
│   └── ThemePanel.tsx   # Collapsible theme switcher
├── App.tsx
└── main.tsx
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build a single self-contained HTML file
npm run build
```

The build output is a single file at `dist/index.html` — open it directly in any browser, no web server needed.

---

## 🧰 Tech Stack

| Tool | Purpose |
|------|---------|
| [React 18](https://react.dev/) | UI & state management |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Vite](https://vitejs.dev/) | Build tooling & dev server |
| [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile) | Inlines all JS/CSS into a single HTML file |
| Web Audio API | Procedural sound synthesis |
| Canvas 2D API | Game rendering |
| CSS Custom Properties | Runtime theme switching |

---

## 📐 Scoring Reference

| Clear Type | Base Points |
|-----------|------------|
| Single (1 line) | 100 |
| Double (2 lines) | 300 |
| Triple (3 lines) | 500 |
| Tetris (4 lines) | 800 |
| T-Spin Single | 400 |
| T-Spin Double | 700 |
| Perfect Clear bonus | +2000 |

- All scores are multiplied by the **difficulty multiplier** (1× – 3×)
- **Back-to-back** high-value clears apply a **1.5× bonus**
- **Combos** add `50 × combo_count` points per consecutive clear
- Soft drop: **+1 pt/cell**, Hard drop: **+2 pts/cell**

---

*Developed by Juan Torres Gómez using React 18, TypeScript, and Vite. Enjoy the game!*

