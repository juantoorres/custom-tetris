import { useCallback, useRef, useState } from 'react';
import { useTheme }      from './context/ThemeContext';
import { useGameEngine } from './hooks/useGameEngine';
import { useKeyboard }   from './hooks/useKeyboard';
import { SetupScreen }   from './components/SetupScreen';
import { GameScreen }    from './components/GameScreen';
import { Overlay }       from './components/Overlay';
import { ThemePanel }    from './components/ThemePanel';
import { AudioEngine }   from './utils/audioEngine';
import type { PieceKey } from './engine/types';

export default function App() {
  const { theme } = useTheme();
  const audioRef  = useRef(new AudioEngine());
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioRef.current.setMuted(next);
  };

  const getThemeColor = useCallback(
    (key: PieceKey) => theme.tetrominoColors[key],
    [theme],
  );

  const { state, actions } = useGameEngine(getThemeColor, audioRef.current);

  useKeyboard(actions, state.phase);

  const handleBackToMenu = () => window.location.reload();

  return (
    <>
      <ThemePanel />

      {/* Mute button — always visible */}
      <button
        className="mute-btn"
        onClick={toggleMute}
        title={muted ? 'Unmute sounds' : 'Mute sounds'}
        aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      <div className="app-header">
        <h1>Tetris</h1>
      </div>

      {state.phase === 'setup' && (
        <SetupScreen onStart={actions.startGame} />
      )}

      {(state.phase === 'playing' || state.phase === 'paused') && (
        <GameScreen state={state} actions={actions} />
      )}

      {state.phase === 'over' && (
        <>
          <GameScreen state={state} actions={actions} />
          <Overlay
            score={state.score}
            lines={state.lines}
            elapsed={state.elapsed}
            onRestart={actions.restartGame}
            onBackToMenu={handleBackToMenu}
          />
        </>
      )}
    </>
  );
}

