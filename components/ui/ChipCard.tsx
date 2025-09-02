

import React, { useMemo } from 'react';
import { Owner, SemanticColorPalette } from '../../types/game';
import { PLAYER_THREE_COLORS } from '../../data/theme';
import ValueDisplay from './ValueDisplay';

interface ChipCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  valueType?: 'force' | 'duration' | 'text';
  owner?: Owner;
  worldPalette?: SemanticColorPalette;
  iconColorClass?: string;
  iconColorHex?: string;
  briefingProps?: {
    type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile';
    key: string;
  };
  onClick?: () => void;
  align?: 'center' | 'start';
  ownerForces?: { owner: Owner; forces: number }[];
}

const ChipCard: React.FC<ChipCardProps> = ({ 
  icon, title, subtitle, value, valueType = 'text',
  owner, worldPalette, iconColorClass, 
  iconColorHex, briefingProps, onClick, align = 'start',
  ownerForces
}) => {
  const briefingDataAttributes = briefingProps
    ? {
        'data-briefing-type': briefingProps.type,
        'data-briefing-key': briefingProps.key,
      }
    : {};

  const effectiveAlign = !subtitle ? 'center' : align;
  const alignmentClass = effectiveAlign === 'center' ? 'items-center' : 'items-start';
  const iconMarginClass = effectiveAlign === 'start' ? 'mt-1' : '';
  const isInteractive = briefingProps || onClick;
  const interactiveClasses = isInteractive ? 'hover:bg-neutral-700/50 transition-colors duration-150' : '';
  
  const palette = useMemo(() => {
    if (owner === 'player-1') return PLAYER_THREE_COLORS['player-1'];
    if (owner === 'player-2') return PLAYER_THREE_COLORS['player-2'];
    if (worldPalette) return worldPalette;
    return null;
  }, [owner, worldPalette]);

  let finalIconColorClass = iconColorClass;
  let finalIconColorHex = iconColorHex;

  // If no override color is provided, determine color from the semantic palette.
  if (!finalIconColorClass && !finalIconColorHex) {
      if (palette) {
          finalIconColorHex = palette.icon;
      } else {
          finalIconColorClass = 'text-neutral-400';
      }
  }

  const iconStyle = finalIconColorHex ? { color: finalIconColorHex } : {};
  const effectiveIconColorClass = finalIconColorHex ? '' : finalIconColorClass;

  const Component = isInteractive ? 'button' : 'div';

  return (
    <Component
      className={`bg-neutral-800 rounded-lg p-3 flex w-full text-left ${alignmentClass} space-x-3 ${interactiveClasses}`}
      onClick={onClick}
      {...briefingDataAttributes}
    >
      <span className={`material-symbols-outlined text-2xl ${effectiveIconColorClass} ${iconMarginClass}`} style={iconStyle}>{icon}</span>
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-gray-200 text-lg" title={title}>{title}</p>
        {subtitle && <p className="text-base text-neutral-500" title={subtitle}>{subtitle}</p>}
      </div>
      <ValueDisplay
        value={value}
        valueType={valueType}
        owner={owner}
        worldPalette={worldPalette}
        size="small"
        ownerForces={ownerForces}
      />
    </Component>
  );
};

export default ChipCard;