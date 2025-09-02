

import React from 'react';
import { ActiveGambit } from '../../types/game';
import { GAMBITS } from '../../data/gambits';

interface ButtonGambitProps {
  activeGambit: ActiveGambit;
  onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ButtonGambit: React.FC<ButtonGambitProps> = ({ activeGambit, onMouseEnter, onMouseLeave }) => {
  const profile = GAMBITS[activeGambit.key];
  if (!profile) return null;

  let stateClasses = '';
  let iconColorClass = '';
  let ringClass = '';

  switch (activeGambit.state) {
    case 'available':
      stateClasses = 'bg-[var(--color-accent-800)] hover:bg-[var(--color-accent-700)]';
      iconColorClass = 'text-[var(--color-accent-400)]';
      break;
    case 'locked':
      stateClasses = 'bg-neutral-800';
      iconColorClass = 'text-neutral-600';
      break;
    case 'active':
      stateClasses = 'bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-400)]';
      iconColorClass = 'text-[var(--color-accent-50)]';
      ringClass = 'ring-2 ring-[var(--color-accent-500)]';
      break;
    case 'depleted':
      stateClasses = 'bg-neutral-800 opacity-50';
      iconColorClass = 'text-neutral-600';
      break;
  }

  return (
    <button
      className={`relative w-14 h-14 rounded-full grid place-items-center flex-shrink-0 transition-all duration-200 ${stateClasses}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      disabled={activeGambit.state === 'depleted' || activeGambit.state === 'locked'}
    >
      <span className={`material-symbols-outlined text-3xl ${iconColorClass}`}>
        {profile.icon}
      </span>
      {activeGambit.state === 'active' && activeGambit.remainingDuration && (
        <div className={`absolute -top-1 -right-1 w-5 h-5 bg-neutral-50 rounded-full flex items-center justify-center text-xs font-bold text-neutral-900 z-10 ${ringClass}`}>
            {activeGambit.remainingDuration}
        </div>
      )}
    </button>
  );
};

export default ButtonGambit;