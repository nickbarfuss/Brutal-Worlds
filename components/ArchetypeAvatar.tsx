

import React from 'react';
import { ARCHETYPES } from '../data/archetypes';
import Avatar from './ui/Avatar';
import { PlayerIdentifier } from '../types/game';
import { THEME_CONFIG } from '../data/theme';

interface ArchetypeAvatarProps {
  owner: PlayerIdentifier;
  archetypeKey: string | null;
}

const ArchetypeAvatar: React.FC<ArchetypeAvatarProps> = ({ owner, archetypeKey }) => {
  const isPlayer1 = owner === 'player-1';
  const archetype = archetypeKey ? ARCHETYPES[archetypeKey] : null;
  
  const playerTheme = isPlayer1 ? THEME_CONFIG.player1 : THEME_CONFIG.player2;
  const bgColorClass = `bg-${playerTheme}-800`;
  const iconColorClass = `text-${playerTheme}-400`;
  const icon = archetype ? archetype.icon : (isPlayer1 ? 'neurology' : 'psychology');

  return (
    <div className="shadow-lg" role="button">
      <Avatar
        icon={icon}
        sizeClass="w-16 h-16"
        iconSizeClass="text-4xl"
        bgColorClass={bgColorClass}
        iconColorClass={iconColorClass}
      />
    </div>
  );
};

export default ArchetypeAvatar;