

import React, { useRef, useState, useEffect } from 'react';
import { ActiveGambit } from '../types/game';
import { GambitProfile } from '../types/profiles';
import Card from './ui/Card';

interface GambitCardProps {
  gambit: {
    profile: GambitProfile;
    active: ActiveGambit;
    position: { top: number; left: number };
  } | null;
}

const GambitCard: React.FC<GambitCardProps> = ({ gambit }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [adjustedTop, setAdjustedTop] = useState<number | null>(null);

  useEffect(() => {
    if (gambit && cardRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const margin = 16; // 1rem padding from window edge

      let top = gambit.position.top;

      // Check if it would go off the bottom of the screen
      if (top + cardRect.height > windowHeight - margin) {
        top = windowHeight - cardRect.height - margin;
      }
      
      // Check if it would go off the top of the screen
      if (top < margin) {
        top = margin;
      }
      
      setAdjustedTop(top);
    } else {
      setAdjustedTop(null);
    }
  }, [gambit]);

  if (!gambit) {
    return null;
  }

  const { profile, active, position } = gambit;

  let statusLabel = '';
  let statusValue = '';

  switch (active.state) {
    case 'locked':
      statusLabel = 'Available';
      statusValue = `Turn ${profile.availabilityTurn}`;
      break;
    case 'available':
      statusLabel = 'Uses';
      statusValue = `${active.remainingUses} / ${profile.uses}`;
      break;
    case 'active':
      statusLabel = 'Duration';
      statusValue = `${active.remainingDuration} Turns Left`;
      break;
    case 'depleted':
      statusLabel = 'Status';
      statusValue = 'Depleted';
      break;
  }

  const details = [
    { label: 'Target', value: profile.target },
    { label: 'Restriction', value: profile.restriction },
    { label: statusLabel, value: statusValue },
  ].filter(d => d.value !== 'None' && d.label !== '');

  return (
    <Card
      ref={cardRef}
      className="fixed w-96 bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-xl pointer-events-none z-30 animate-fade-in-briefing transform translate-x-[72px]"
      style={{
        top: `${adjustedTop ?? position.top}px`, 
        left: `${position.left}px`,
        visibility: adjustedTop === null ? 'hidden' : 'visible'
      }}
    >
      <Card.Header
        icon={profile.icon}
        iconColorClass="text-[var(--color-accent-400)]"
        title={profile.name}
        subtitle={`${profile.category} Gambit`}
      />
      
      {profile.description && (
        <Card.Section title="Description">
          <p className="text-base text-neutral-300">{profile.description}</p>
        </Card.Section>
      )}
      {profile.effect && (
        <Card.Section title="Effect">
          <p className="text-base text-neutral-300">{profile.effect}</p>
        </Card.Section>
      )}
      <Card.Section>
        <div className="grid grid-cols-3 gap-4 text-center">
            {details.map(detail => (
                <div key={detail.label}>
                    <p className="font-semibold text-neutral-300 text-lg">{detail.value}</p>
                    <p className="text-sm text-neutral-500">{detail.label}</p>
                </div>
            ))}
        </div>
      </Card.Section>
    </Card>
  );
};

export default GambitCard;