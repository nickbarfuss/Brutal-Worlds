
import React from 'react';
import { Enclave, Rift, Expanse, ActiveDisasterMarker } from '../../types/game';
import { DISASTER_PROFILES } from '../../data/disasters';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';
import { getIconForEntityType } from '../../utils/entityUtils';

interface VoidInspectorProps {
    entity: Rift | Expanse;
    type: 'rift' | 'expanse';
    activeDisasterMarkers: ActiveDisasterMarker[];
    enclaveData: { [id: number]: Enclave };
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const VoidInspector: React.FC<VoidInspectorProps> = ({ entity, type, activeDisasterMarkers, enclaveData, onPointerMove, onPointerLeave }) => {
    const activeMarker = activeDisasterMarkers.find(marker => marker.position.equals(entity.center));
      
    const nearbyEnclaves = Object.values(enclaveData).filter(e => e.center.distanceTo(entity.center) < 15);
    const aftermathEffects = nearbyEnclaves.flatMap(e => e.activeEffects).filter(eff => eff.phase === 'aftermath');
    const uniqueAftermathKeys = [...new Set(aftermathEffects.map(eff => eff.profileKey))];

    const hasEffects = !!activeMarker || uniqueAftermathKeys.length > 0;

    return (
        <>
          <div className="sticky top-0 bg-neutral-900/80 backdrop-blur-sm z-10 flex-shrink-0">
              <div className="w-full h-2 bg-neutral-800" />
               <Card.Header
                  icon={getIconForEntityType(type)}
                  iconColorClass="text-neutral-500"
                  title={entity.name}
                  subtitle={type === 'rift' ? 'Rift' : 'Expanse'}
              />
          </div>
          
          <div className="flex-grow overflow-y-auto no-scrollbar" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
              <Card.Section title="Description" hasContent={!!entity.description}>
                  <p className="text-neutral-400 text-base">{entity.description}</p>
              </Card.Section>
              <Card.Section title="Active Effects" hasContent={hasEffects}>
                 {activeMarker && (() => {
                    const profile = DISASTER_PROFILES[activeMarker.profileKey];
                    if (!profile) return null;
                    return (
                      <ChipCard
                          key={activeMarker.id}
                          icon={profile.ui.icon}
                          iconColorClass="text-amber-400"
                          value={activeMarker.duration}
                          valueType="duration"
                          briefingProps={{ type: 'effect', key: activeMarker.profileKey }}
                          title={profile.logic.alert.name}
                          subtitle={profile.ui.name}
                      />
                    );
                 })()}
                 {uniqueAftermathKeys.map(key => {
                      const effect = aftermathEffects.find(e => e.profileKey === key);
                      const profile = DISASTER_PROFILES[key];
                      if (!effect || !profile || !profile.logic.aftermath) return null;
  
                      return (
                          <ChipCard
                              key={`aftermath-${key}`}
                              icon={profile.ui.icon}
                              iconColorClass="text-amber-400"
                              value={effect.duration}
                              valueType="duration"
                              briefingProps={{ type: 'effect', key: key }}
                              title={profile.logic.aftermath.name}
                              subtitle={profile.ui.name}
                          />
                      );
                 })}
              </Card.Section>
          </div>
        </>
    );
};

export default VoidInspector;