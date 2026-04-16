import { useState } from 'react';
import type { GameMode } from '../engine/types';
import type { GameActions } from '../hooks/useGameEngine';

interface Props {
  onStart: GameActions['startGame'];
}

export function SetupScreen({ onStart }: Props) {
  const [difficulty, setDifficulty] = useState(1);
  const [mode, setMode]             = useState<GameMode>('normal');

  return (
    <section className="setup-screen" aria-label="Game setup">
      <h2>Setup your match</h2>

      <div className="option-group">
        <label>Difficulty (Drop Speed)</label>
        <div className="btn-row" role="group" aria-label="Difficulty selection">
          {([1,2,3,4,5] as const).map(d => (
            <button
              key={d}
              className={`opt-btn${difficulty === d ? ' selected' : ''}`}
              aria-pressed={difficulty === d}
              onClick={() => setDifficulty(d)}
            >
              {d === 1 ? '1 — Easy' : d === 5 ? '5 — Hard' : String(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>Game Mode</label>
        <div className="btn-row" role="group" aria-label="Game mode selection">
          <button
            className={`opt-btn${mode === 'normal' ? ' selected' : ''}`}
            aria-pressed={mode === 'normal'}
            onClick={() => setMode('normal')}
          >Normal ↓</button>
          <button
            className={`opt-btn${mode === 'inverted' ? ' selected' : ''}`}
            aria-pressed={mode === 'inverted'}
            onClick={() => setMode('inverted')}
          >Inverted ↑</button>
        </div>
      </div>

      <button className="start-btn" onClick={() => onStart(difficulty, mode)}>
        Start Match
      </button>
    </section>
  );
}
