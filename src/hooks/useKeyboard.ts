import { useEffect } from 'react';
import type { GameActions } from './useGameEngine';
import type { GamePhase } from '../engine/types';

export function useKeyboard(actions: GameActions, phase: GamePhase) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'setup') return;
      switch (e.code) {
        case 'ArrowLeft':  e.preventDefault(); actions.move(-1);       break;
        case 'ArrowRight': e.preventDefault(); actions.move(1);        break;
        case 'ArrowUp':    e.preventDefault(); actions.rotate(1);      break;
        case 'KeyZ':       e.preventDefault(); actions.rotate(-1);     break;
        case 'ArrowDown':  e.preventDefault(); actions.softDrop();     break;
        case 'Space':      e.preventDefault(); actions.hardDrop();     break;
        case 'KeyC':       e.preventDefault(); actions.holdAction();   break;
        case 'KeyP':       e.preventDefault(); actions.togglePause();  break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [actions, phase]);
}
