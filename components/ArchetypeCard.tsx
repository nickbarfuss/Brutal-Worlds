

import React from 'react';
import { ARCHETYPES } from '../data/archetypes';
import { BIRTHRIGHTS } from '../data/birthrights';
import { GAMBITS } from '../data/gambits';
import ChipCard from './ui/ChipCard';
import Card from './ui/Card';
import { PlayerIdentifier } from '../types/game';
import { THEME_CONFIG } from '../data/theme';
import { getAssetUrl } from '../utils/assetUtils';

interface ArchetypeCardProps {
  owner: PlayerIdentifier;
  archetypeKey: string | null;
  skinIndex: number | null;
}

const ArchetypeCard: React.FC<ArchetypeCardProps> = ({ owner, archetypeKey, skinIndex }) => {
  const isPlayer1 = owner === 'player-1';
  const text = isPlayer1 ? 'You' : 'Opponent';
  const archetype = archetypeKey ? ARCHETYPES[archetypeKey] : null;
  const birthright = archetype ? BIRTHRIGHTS[archetype.birthrightKey] : null;
  const playerTheme = isPlayer1 ? THEME_CONFIG.player1 : THEME_CONFIG.player2;
  const iconColorClass = `text-${playerTheme}-400`;

  // FIX: Refactored opponent positioning to use a more robust transform-based
  // approach. `right-full` can have inconsistent behavior, whereas this method is
  // more explicit and less prone to browser rendering quirks that could lead to a crash.
  const positionClasses = isPlayer1
    ? 'left-full ml-4'
    : 'left-0 -translate-x-[calc(100%+1rem)]';

  if (!archetype || !birthright) {
    return (
        <Card className={`absolute top-0 w-96 bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10 ${positionClasses}`}>
            <Card.Header title={text} subtitle="Archetype not selected." />
        </Card>
    );
  }

  const archetypeImage = archetype.skins?.[skinIndex ?? 0]?.imageUrl;

  return (
    <Card className={`absolute top-0 w-96 bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-10 ${positionClasses}`}>
      <Card.Header 
        icon={archetype.icon}
        iconColorClass={iconColorClass}
        title={archetype.name}
        subtitle={text}
      />
      {archetypeImage && (
        <div className="w-full aspect-video">
            <img 
                src={getAssetUrl(archetypeImage)} 
                alt={`Illustration of ${archetype.name}`}
                className="w-full h-full object-cover" 
            />
        </div>
      )}
      <Card.Section title="Description">
        <p className="text-base text-neutral-300">{archetype.description}</p>
      </Card.Section>
      <Card.Section title="Birthright">
        <ChipCard
          icon={birthright.icon}
          iconColorClass={iconColorClass}
          title={birthright.name}
          subtitle={birthright.effect}
        />
      </Card.Section>
      <Card.Section title="Gambits">
        <div className="space-y-2">
          {archetype.gambitKeys.map(key => {
            const gambit = GAMBITS[key];
            if (!gambit) return null;
            return (
              <ChipCard
                key={key}
                icon={gambit.icon}
                iconColorClass={iconColorClass}
                title={gambit.name}
                subtitle={gambit.description}
              />
            );
          })}
        </div>
      </Card.Section>
    </Card>
  );
};

export default ArchetypeCard;