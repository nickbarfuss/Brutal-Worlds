
import React, { useState, useEffect, useRef } from 'react';
import RadialChart from './ui/RadialChart';
import RadialMeter from './ui/RadialMeter';

interface TurnDisplayProps {
  playerPercentage: number;
  opponentPercentage: number;
  neutralPercentage: number;
  playerColor: string;
  opponentColor: string;
  neutralColor: string;
  currentTurn: number;
  turnDuration: number;
  isPaused: boolean;
  isGameOver: boolean;
  isResolvingTurn: boolean; // New prop
  togglePause: () => void;
}

const TurnDisplay: React.FC<TurnDisplayProps> = ({
  playerPercentage,
  opponentPercentage,
  neutralPercentage,
  playerColor,
  opponentColor,
  neutralColor,
  currentTurn,
  turnDuration,
  isPaused,
  isGameOver,
  isResolvingTurn,
  togglePause,
}) => {
  const size = 120;
  const dominationStrokeWidth = 8;
  const timerStrokeWidth = 4;
  const gap = 6;
  const timerSize = size;
  const chartSize = size - (timerStrokeWidth * 2) - (gap * 2);

  const [displayTurn, setDisplayTurn] = useState(currentTurn > 0 ? currentTurn : 1);
  const [animationClass, setAnimationClass] = useState('opacity-0');
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTurnRef = useRef(currentTurn);

  const isTurnZero = currentTurn === 0;

  useEffect(() => {
    if (prevTurnRef.current !== currentTurn) {
      if (currentTurn > 0) { // Only animate number changes
        setAnimationClass('animate-fade-out-turn');
        
        const fadeOutDuration = 200; // ms, matching CSS
        const timeout = setTimeout(() => {
          setDisplayTurn(currentTurn);
          setAnimationClass('animate-fade-in-bounce-turn');
        }, fadeOutDuration);

        prevTurnRef.current = currentTurn;
        return () => clearTimeout(timeout);
      } else {
        setDisplayTurn(1);
        setAnimationClass('opacity-0');
        prevTurnRef.current = currentTurn;
      }
    }
  }, [currentTurn]);

  useEffect(() => {
    if (currentTurn > 0 && animationClass === 'opacity-0') {
      const initialTimeout = setTimeout(() => {
        setDisplayTurn(currentTurn);
        setAnimationClass('animate-fade-in-bounce-turn');
      }, 100); 
      return () => clearTimeout(initialTimeout);
    }
  }, [currentTurn, animationClass]);

  useEffect(() => {
    setIsPulsing(false); 
    if (isPaused || isGameOver || isTurnZero || isResolvingTurn) return;
    
    const pulseTimeout = setTimeout(() => {
        setIsPulsing(true);
    }, (turnDuration - 3) * 1000);
    
    return () => clearTimeout(pulseTimeout);
  }, [currentTurn, isPaused, isGameOver, turnDuration, isTurnZero, isResolvingTurn]);

  const chartSegments = [
    { percentage: playerPercentage, color: playerColor },
    { percentage: opponentPercentage, color: opponentColor },
    { percentage: neutralPercentage, color: neutralColor },
  ];

  const pulseClass = isPulsing ? 'animate-turn-attention-pulse' : '';

  return (
    <button onClick={togglePause} disabled={isGameOver || isTurnZero || isResolvingTurn} className={`relative group focus:outline-none flex-shrink-0 transition-transform ${pulseClass}`} style={{ width: size, height: size }}>
      <div className="absolute inset-0 grid place-items-center">
        <RadialChart
          size={chartSize}
          strokeWidth={dominationStrokeWidth}
          segments={chartSegments}
          gap={gap}
        />
      </div>
      <div className={`absolute inset-0 transition-opacity duration-300 ${isTurnZero || isResolvingTurn ? 'opacity-0' : 'opacity-100'}`}>
         <RadialMeter
            size={timerSize}
            strokeWidth={timerStrokeWidth}
            color={playerColor}
            trackColor={'#27272a'}
            duration={turnDuration}
            isPaused={isPaused}
            isGameOver={isGameOver}
            currentTurn={currentTurn}
         />
      </div>
     
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        {/* Turn Number / Pause Icon Container */}
        <div className={`col-start-1 row-start-1 flex items-center justify-center transition-opacity duration-200 ${!isTurnZero && !isResolvingTurn ? 'opacity-100' : 'opacity-0'}`}>
          <span className={`font-bold text-white text-3xl leading-none group-hover:hidden ${animationClass}`}>
              {displayTurn}
          </span>
          <span className="material-symbols-outlined text-white text-5xl hidden group-hover:block">
            {isPaused ? 'play_arrow' : 'pause'}
          </span>
        </div>
        {/* Hourglass for Turn 0 */}
        <div className={`col-start-1 row-start-1 flex items-center justify-center transition-opacity duration-200 ${isTurnZero ? 'opacity-100' : 'opacity-0'}`}>
          <span className="material-symbols-outlined text-white text-5xl animate-hourglass-tick">
            hourglass_empty
          </span>
        </div>
        {/* Spinner for Resolving Turn */}
        <div className={`col-start-1 row-start-1 flex items-center justify-center transition-opacity duration-200 ${isResolvingTurn ? 'opacity-100' : 'opacity-0'}`}>
            <div className="h-10 w-10 border-4 border-neutral-700 border-t-neutral-100 rounded-full animate-rotate-continuously"></div>
        </div>
      </div>
    </button>
  );
};

export default TurnDisplay;
