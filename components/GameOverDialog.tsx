
import React from 'react';
import { GameOverState } from '../types/game';
import ButtonBasic from './ui/ButtonBasic';
import { THEME_CONFIG } from '../data/theme';

interface GameOverDialogProps {
  gameOverState: GameOverState;
  onNewGame: () => void;
  isClosing: boolean;
}

const GameOverDialog: React.FC<GameOverDialogProps> = ({ gameOverState, onNewGame, isClosing }) => {
  if (gameOverState === 'none') return null;

  const animationClass = isClosing ? 'animate-close-dialog' : 'animate-open-dialog';
  const isVictory = gameOverState === 'victory';
  const title = isVictory ? 'VICTORY' : 'DEFEAT';
  const message = isVictory
    ? 'You have asserted dominance and crushed your opponent.'
    : 'Your final enclave has fallen. Your legacy ends here.';
  
  const titleColorName = isVictory ? THEME_CONFIG.player1 : THEME_CONFIG.player2;
  const titleColorClass = `text-${titleColorName}-400`;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 ${animationClass}`}>
      <div className="bg-neutral-900 text-center flex flex-col w-full max-w-md rounded-lg border border-neutral-700 p-8">
        <h1 className={`text-6xl font-bold tracking-widest ${titleColorClass}`}>{title}</h1>
        <p className="text-neutral-300 mt-4 text-lg">{message}</p>
        <ButtonBasic
          onClick={onNewGame}
          className="mt-8 self-center"
        >
          New Game
        </ButtonBasic>
      </div>
    </div>
  );
};

export default GameOverDialog;