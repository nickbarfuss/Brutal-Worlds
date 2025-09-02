import React, { useCallback } from 'react';
import { Owner, Enclave, Domain, Rift, Expanse, HighlightType, ActiveHighlight, WorldProfile } from '../types/game';
import { getIconForEntityType, getDomainOwner } from '../utils/entityUtils';
import { PLAYER_THREE_COLORS } from '../data/theme';
import ChipGroup from './ui/ChipGroup';

interface LegendDisplayProps {
  enclaveData: { [id: number]: Enclave };
  domainData: { [id: number]: Domain };
  riftData: { [id: number]: Rift };
  expanseData: { [id: number]: Expanse };
  currentWorld: WorldProfile | null;
  activeHighlight: ActiveHighlight | null;
  onHighlightChange: (highlight: ActiveHighlight | null) => void;
  isWorldInspected: boolean;
  onInspectWorld: () => void;
}

const LegendDisplay: React.FC<LegendDisplayProps> = ({
  enclaveData, domainData, riftData, expanseData,
  currentWorld, activeHighlight, onHighlightChange,
  isWorldInspected, onInspectWorld
}) => {

  const handleLabelClick = (type: HighlightType) => {
    const allOwnersForType: Owner[] = [];
    if (type === 'domains' || type === 'enclaves') {
      allOwnersForType.push('player-1', 'player-2', null);
    } else {
      allOwnersForType.push(null); // Rifts/Expanses are always neutral
    }

    if (activeHighlight?.type === type && activeHighlight.owners.size === allOwnersForType.length) {
      onHighlightChange(null);
    } else {
      onHighlightChange({ type, owners: new Set(allOwnersForType) });
    }
  };

  const handleSegmentClick = (type: HighlightType, owner: Owner) => {
    if (activeHighlight?.type !== type) {
      onHighlightChange({ type, owners: new Set([owner]) });
      return;
    }
    
    const newOwners = new Set(activeHighlight.owners);
    if (newOwners.has(owner)) {
      newOwners.delete(owner);
    } else {
      newOwners.add(owner);
    }

    if (newOwners.size === 0) {
      onHighlightChange(null);
    } else {
      onHighlightChange({ type, owners: newOwners });
    }
  };
  
  const enclaves = Object.values(enclaveData);
  const domains = Object.values(domainData);

  const counts: {
      [key in HighlightType]: { [key in 'player-1' | 'player-2' | 'null']: number }
  } = {
      domains: { 'player-1': 0, 'player-2': 0, 'null': 0 },
      enclaves: { 'player-1': 0, 'player-2': 0, 'null': 0 },
      expanses: { 'player-1': 0, 'player-2': 0, 'null': Object.keys(expanseData).length },
      rifts: { 'player-1': 0, 'player-2': 0, 'null': Object.keys(riftData).length },
  };

  enclaves.forEach(e => counts.enclaves[String(e.owner) as 'player-1' | 'player-2' | 'null']++);
  domains.forEach(d => {
    const owner = getDomainOwner(d.id, enclaveData);
    counts.domains[String(owner) as 'player-1' | 'player-2' | 'null']++;
  });
  
  const palette = currentWorld?.neutralColorPalette;
  if (!palette) return null;
  
  const ownerColors = {
      'player-1': PLAYER_THREE_COLORS['player-1'].selected,
      'player-2': PLAYER_THREE_COLORS['player-2'].selected,
      'null': palette.selected,
  };

  const chipData = [
      { type: 'domains' as HighlightType, label: 'Domains', segments: [ { id: 'player-1' as Owner, icon: getIconForEntityType('domain'), color: ownerColors['player-1'], count: counts.domains['player-1'] }, { id: 'player-2' as Owner, icon: getIconForEntityType('domain'), color: ownerColors['player-2'], count: counts.domains['player-2'] }, { id: null as Owner, icon: getIconForEntityType('domain'), color: ownerColors.null, count: counts.domains.null } ] },
      { type: 'enclaves' as HighlightType, label: 'Enclaves', segments: [ { id: 'player-1' as Owner, icon: getIconForEntityType('enclave'), color: ownerColors['player-1'], count: counts.enclaves['player-1'] }, { id: 'player-2' as Owner, icon: getIconForEntityType('enclave'), color: ownerColors['player-2'], count: counts.enclaves['player-2'] }, { id: null as Owner, icon: getIconForEntityType('enclave'), color: ownerColors.null, count: counts.enclaves.null } ] },
      { type: 'expanses' as HighlightType, label: 'Expanses', segments: [{ id: null as Owner, icon: getIconForEntityType('expanse'), color: ownerColors.null, count: counts.expanses.null, }] },
      { type: 'rifts' as HighlightType, label: 'Rifts', segments: [{ id: null as Owner, icon: getIconForEntityType('rift'), color: ownerColors.null, count: counts.rifts.null, }] }
  ];

  return (
    <div className={`flex flex-row flex-wrap items-center justify-center gap-2`}>
      <button
        onClick={onInspectWorld}
        className={`w-14 h-[38px] flex items-center justify-center text-neutral-300 rounded-full transition-colors ${
          isWorldInspected ? 'bg-neutral-700' : 'bg-neutral-800 hover:bg-neutral-700'
        }`}
        aria-label={isWorldInspected ? "Close World Inspector" : "Open World Inspector"}
      >
        <span className="material-symbols-outlined text-2xl">
          {getIconForEntityType('world')}
        </span>
      </button>
      {chipData.map(({ type, label, segments }) => (
          <ChipGroup
              key={type}
              type={type}
              label={label}
              segments={segments}
              activeOwners={activeHighlight?.type === type ? activeHighlight.owners : new Set()}
              onLabelClick={handleLabelClick}
              onSegmentClick={handleSegmentClick}
          />
      ))}
    </div>
  );
};

export default LegendDisplay;