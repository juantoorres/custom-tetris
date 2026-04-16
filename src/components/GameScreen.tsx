import { BoardCanvas } from './BoardCanvas';
import { HoldCanvas }  from './HoldCanvas';
import { NextCanvas }  from './NextCanvas';
import { useTheme }    from '../context/ThemeContext';
import type { GameState } from '../engine/types';
import type { GameActions } from '../hooks/useGameEngine';

interface Props {
  state: GameState;
  actions: GameActions;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function GameScreen({ state, actions }: Props) {
  const { theme } = useTheme();
  const modeLbl   = state.mode === 'inverted' ? 'Inverted ↑' : 'Normal ↓';

  return (
    <section className="game-screen" aria-label="Tetris game">
      <div className="game-area">

        {/* ── Left panel ── */}
        <div className="side-panel">
          <div className="panel-box">
            <h3>Hold</h3>
            <HoldCanvas pieceKey={state.holdPiece} theme={theme} dimmed={state.holdUsed} />
          </div>
          <div className="panel-box">
            <h3>Score</h3>
            <div className="stat-val">{state.score.toLocaleString()}</div>
          </div>
          <div className="panel-box">
            <h3>Lines</h3>
            <div className="stat-val">{state.lines}</div>
          </div>
          <div className="panel-box">
            <h3>Combo</h3>
            <div className="stat-val combo">{state.combo > 0 ? `x${state.combo}` : 'x0'}</div>
          </div>
          <div className="panel-box">
            <h3>Time</h3>
            <div className="stat-val timer">{formatTime(state.elapsed)}</div>
          </div>
        </div>

        {/* ── Board ── */}
        <BoardCanvas state={state} theme={theme} />

        {/* ── Right panel ── */}
        <div className="side-panel">
          <div className="panel-box">
            <h3>Next</h3>
            <NextCanvas queue={state.nextQueue} theme={theme} />
          </div>
          <div className="panel-box">
            <h3>Mode</h3>
            <div className="mode-badge">{modeLbl}</div>
          </div>
          <div className="panel-box">
            <h3>Diff</h3>
            <div className="mode-badge">{state.difficulty}</div>
          </div>
        </div>

      </div>

      <div className="controls-bar" role="note">
        <span>← →</span> Move &nbsp;|&nbsp;
        <span>↑ / Z</span> Rotate CW/CCW &nbsp;|&nbsp;
        <span>↓</span> Soft Drop &nbsp;|&nbsp;
        <span>Space</span> Hard Drop &nbsp;|&nbsp;
        <span>C</span> Hold &nbsp;|&nbsp;
        <span>P</span> Pause
      </div>

      {state.phase === 'paused' && (
        <p style={{ color: 'var(--accent)', marginTop: 8, letterSpacing: 2 }}>
          — PAUSED — press P to resume
        </p>
      )}

      <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
        <button className="opt-btn" onClick={actions.togglePause} style={{ padding: '6px 14px' }}>
          {state.phase === 'paused' ? 'Resume' : 'Pause'}
        </button>
      </div>
    </section>
  );
}
