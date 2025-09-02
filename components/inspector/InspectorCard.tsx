import React, { useRef, useState, useEffect } from 'react';
import { Enclave, Domain, PendingOrders, InspectedEntity, Rift, Expanse, ActiveDisasterMarker, Route } from '../../types/game';
import { WorldProfile } from '../../types/profiles';
import Card from '../ui/Card';
import EnclaveInspector from './EnclaveInspector';
import VoidInspector from './VoidInspector';
import WorldInspector from './WorldInspector';

interface InspectorCardProps {
  isVisible: boolean;
  inspectedEntity: InspectedEntity | null;
  selectedEnclaveId: number | null;
  enclaveData: { [id: number]: Enclave };
  domainData: { [id: number]: Domain };
  riftData: { [id: number]: Rift };
  expanseData: { [id: number]: Expanse };
  pendingOrders: PendingOrders;
  routes: Route[];
  currentWorld: WorldProfile | null;
  activeDisasterMarkers: ActiveDisasterMarker[];
  onFocusEnclave: (id: number) => void;
  onShowBriefing: (type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile', contentKey: string) => void;
  onHideBriefing: () => void;
  onTriggerDisaster: (key: string) => void;
}

const InspectorCard: React.FC<InspectorCardProps> = ({
  isVisible, inspectedEntity, selectedEnclaveId, onTriggerDisaster,
  onShowBriefing, onHideBriefing, ...rest
}) => {
  const hoveredBriefingRef = useRef<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const wasSelectedRef = useRef(false);
  const cardIdRef = useRef<string | null>(null);

  const isSelected = inspectedEntity?.type === 'enclave' && selectedEnclaveId === inspectedEntity.id;

  useEffect(() => {
    const cardIdentifier = inspectedEntity ? (inspectedEntity.type === 'world' ? 'world' : `${inspectedEntity.type}-${inspectedEntity.id}`) : null;

    if (cardIdRef.current !== cardIdentifier) {
        wasSelectedRef.current = isSelected;
        cardIdRef.current = cardIdentifier;
        setIsConfirming(false);
        return;
    }
    
    if (wasSelectedRef.current && !isSelected) {
      setIsConfirming(true);
      const timer = setTimeout(() => setIsConfirming(false), 600);
      return () => clearTimeout(timer);
    }

    wasSelectedRef.current = isSelected;
  }, [isSelected, inspectedEntity]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const chip = (e.target as HTMLElement).closest('[data-briefing-key]') as HTMLElement | null;
    const key = chip?.dataset.briefingKey ?? null;

    if (key === hoveredBriefingRef.current) return;
    hoveredBriefingRef.current = key;

    if (chip && key) {
      const type = chip.dataset.briefingType as 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile';
      onShowBriefing(type, key);
    } else {
      onHideBriefing();
    }
  };

  const handlePointerLeave = () => {
    if (hoveredBriefingRef.current) {
        hoveredBriefingRef.current = null;
        onHideBriefing();
    }
  };

  const getContent = () => {
      if (!inspectedEntity) return null;

      const { type } = inspectedEntity;
      const { enclaveData, domainData, riftData, expanseData, currentWorld } = rest;
      
      const commonPointerProps = { onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave };

      if (type === 'world') {
          return currentWorld ? <WorldInspector world={currentWorld} domainData={domainData} enclaveData={enclaveData} riftData={riftData} expanseData={expanseData} onTriggerDisaster={onTriggerDisaster} {...commonPointerProps} /> : null;
      }
      if (type === 'enclave') {
          const enclave = enclaveData[inspectedEntity.id];
          return enclave ? <EnclaveInspector enclave={enclave} isSelected={isSelected} isConfirming={isConfirming} {...rest} {...commonPointerProps} /> : null;
      }
      if (type === 'rift') {
          const rift = riftData[inspectedEntity.id];
          return rift ? <VoidInspector entity={rift} type="rift" enclaveData={enclaveData} activeDisasterMarkers={rest.activeDisasterMarkers} {...commonPointerProps} /> : null;
      }
      if (type === 'expanse') {
          const expanse = expanseData[inspectedEntity.id];
          return expanse ? <VoidInspector entity={expanse} type="expanse" enclaveData={enclaveData} activeDisasterMarkers={rest.activeDisasterMarkers} {...commonPointerProps} /> : null;
      }
      return null;
  };

  const content = getContent();

  return (
    <div className={`fixed top-8 right-8 z-20 w-96 pointer-events-none ${isVisible && content ? 'opacity-100' : 'opacity-0'}`}>
      {content && (
        <Card 
          className="bg-neutral-900 border border-neutral-700/50 rounded-xl w-full max-h-[calc(100vh-12rem)] flex flex-col shadow-lg pointer-events-auto"
        >
          {content}
        </Card>
      )}
    </div>
  );
};

export default React.memo(InspectorCard);