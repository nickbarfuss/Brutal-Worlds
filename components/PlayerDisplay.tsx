

import React from 'react';
import ArchetypeAvatar from './ArchetypeAvatar';
import ArchetypeCard from './ArchetypeCard';
import { PlayerIdentifier } from '../types/game';

interface PlayerDisplayProps {
  owner: PlayerIdentifier;
  archetypeKey: string | null;
  skinIndex: number | null;
}

const PlayerDisplay: React.FC<PlayerDisplayProps> = ({ owner, archetypeKey, skinIndex }) => {
  return (
    <div className="relative group">
      <ArchetypeAvatar owner={owner} archetypeKey={archetypeKey} />
      <ArchetypeCard owner={owner} archetypeKey={archetypeKey} skinIndex={skinIndex} />
    </div>
  );
};

export default PlayerDisplay;