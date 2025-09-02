import React from 'react';
import { Owner, Enclave } from '../types/game';
import { getIconForEntityType } from '../utils/entityUtils';
import { PLAYER_THREE_COLORS } from '../data/theme';

interface WorldDisplayProps {
  planetName: string;
  hoveredEntity: {
    name: string;
    type: 'enclave' | 'domain' | 'rift' | 'expanse';
    owner: Owner;
  } | null;
  isIntroComplete: boolean;
  onSurrender: () => void;
  onToggleSettings: () => void;
}

const WorldDisplay: React.FC<WorldDisplayProps> = ({
  planetName, hoveredEntity, isIntroComplete,
  onSurrender, onToggleSettings
}) => {
  
  const getHoverStyles = (owner: Owner) => {
    if (owner === 'player-1') return { textColorHex: PLAYER_THREE_COLORS['player-1'].text, fontWeight: 'font-semibold' };
    if (owner === 'player-2') return { textColorHex: PLAYER_THREE_COLORS['player-2'].text, fontWeight: 'font-semibold' };
    return { textColorHex: '#9ca3af', fontWeight: 'font-normal' }; // neutral-400
  };

  const renderHoveredEntity = () => {
    if (hoveredEntity) {
      const { textColorHex, fontWeight } = getHoverStyles(hoveredEntity.owner);
      const style = { color: textColorHex };

      return (
        <div className="flex items-center justify-end gap-2 transition-opacity duration-200">
          <span className={`material-symbols-outlined`} style={style}>{getIconForEntityType(hoveredEntity.type)}</span>
          <p className={`text-xl ${fontWeight}`} style={style}>{hoveredEntity.name}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="text-right flex flex-col items-end gap-2 w-auto max-w-md">
      {isIntroComplete && (
        <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold text-white">
                {planetName}
            </h1>
        </div>
      )}

      <div className="min-h-[2.25rem] flex items-center justify-end">
        {isIntroComplete && (
            hoveredEntity ? renderHoveredEntity() : (
                <div className="flex items-center justify-end gap-2 text-sm">
                    <button
                      onClick={onSurrender}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-red-400 bg-neutral-800 rounded-full transition-colors hover:bg-red-900/50 hover:text-red-300"
                      aria-label="Surrender Game"
                    >
                      <span className="material-symbols-outlined text-base">flag</span>
                      Surrender
                    </button>
                    <button
                      onClick={onToggleSettings}
                      className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-neutral-300 bg-neutral-800 rounded-full transition-colors hover:bg-neutral-700"
                      aria-label="Open Settings"
                    >
                      <span className="material-symbols-outlined text-base">settings</span>
                    </button>
                </div>
            )
        )}
      </div>
    </div>
  );
};

export default WorldDisplay;