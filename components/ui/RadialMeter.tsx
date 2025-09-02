import React from 'react';

interface RadialMeterProps {
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
  duration: number;
  isPaused: boolean;
  isGameOver: boolean;
  currentTurn: number; // for key
}

const RadialMeter: React.FC<RadialMeterProps> = ({ size, strokeWidth, color, trackColor, duration, isPaused, isGameOver, currentTurn }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animationStyle = {
    '--turn-duration': `${duration}s`,
    '--pulse-delay': `${duration - 3}s`,
    '--circumference': circumference,
    '--player-color': color,
    '--player-color-pulse': '#eef2ff', // A light indigo
    animationPlayState: isPaused || isGameOver ? 'paused' : 'running',
  } as React.CSSProperties;
  
  // Hide the meter completely when the game is over.
  if (isGameOver) {
    return null;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <g key={currentTurn}> {/* Key forces re-render and animation restart on turn change */}
        {/* Background Track */}
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke={trackColor} strokeWidth={strokeWidth} />
        {/* Animated Timer Bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeLinecap="round"
          className="animate-radial-turn-timer"
          style={animationStyle}
        />
      </g>
    </svg>
  );
};

export default RadialMeter;