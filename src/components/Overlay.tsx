import type { GameActions } from '../hooks/useGameEngine';

interface Props {
  score: number;
  lines: number;
  elapsed: number;
  onRestart: GameActions['restartGame'];
  onBackToMenu: () => void;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function Overlay({ score, lines, elapsed, onRestart, onBackToMenu }: Props) {
  return (
    <div className="overlay" role="dialog" aria-modal aria-labelledby="overlay-title">
      <div className="overlay-box">
        <h2 id="overlay-title">GAME OVER</h2>
        <p>Final Score: <strong>{score.toLocaleString()}</strong></p>
        <p>Lines Cleared: <strong>{lines}</strong></p>
        <p>Time: <strong>{formatTime(elapsed)}</strong></p>
        <div className="overlay-actions">
          <button className="start-btn" onClick={onRestart}>Play Again</button>
          <button className="opt-btn"   onClick={onBackToMenu}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}
