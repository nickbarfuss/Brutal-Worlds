

import React from 'react';
import { Enclave, Domain, PendingOrders, WorldProfile, ActiveDisasterMarker, Route, Owner, Order } from '../../types/game';
import { ORDER_PROFILES } from '../../data/orders';
import { PLAYER_THREE_COLORS, THEME_CONFIG } from '../../data/theme';
import { DISASTER_PROFILES } from '../../data/disasters';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';
import { getIconForEntityType, getIconForRouteStatus } from '../../utils/entityUtils';
import { getAppliedModifiers } from '../../logic/effectProcessor';
import { getAttackBonusForEnclave, getAssistMultiplierForEnclave, getHoldingBonusForEnclave } from '../../logic/birthrightManager';
import { getAssetUrl } from '../../utils/assetUtils';

interface EnclaveInspectorProps {
    enclave: Enclave;
    enclaveData: { [id: number]: Enclave };
    domainData: { [id: number]: Domain };
    pendingOrders: PendingOrders;
    routes: Route[];
    currentWorld: WorldProfile | null;
    activeDisasterMarkers: ActiveDisasterMarker[];
    isSelected: boolean;
    isConfirming: boolean;
    onFocusEnclave: (id: number) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const getPaletteForOwner = (owner: Owner, worldProfile: WorldProfile | null) => {
    if (owner === 'player-1') return PLAYER_THREE_COLORS['player-1'];
    if (owner === 'player-2') return PLAYER_THREE_COLORS['player-2'];
    if (worldProfile) return worldProfile.neutralColorPalette;
    // Fallback default
    return {
        base: '#737373', hover: '#a3a3a3', target: '#d4d4d4', selected: '#d4d4d4',
        light: '#fafafa', dark: '#262626', disabled: '#404040', icon: '#d4d4d4', text: '#d4d4d4'
    };
};

const EnclaveInspector: React.FC<EnclaveInspectorProps> = ({
    enclave, enclaveData, domainData, pendingOrders, routes, currentWorld, activeDisasterMarkers,
    isSelected, isConfirming, onFocusEnclave,
    onPointerMove, onPointerLeave
}) => {
    
    const palette = getPaletteForOwner(enclave.owner, currentWorld);

    const outgoingOrder = pendingOrders[enclave.id];
    const incomingOrders = (Object.entries(pendingOrders) as [string, Order][]).filter(([, order]) => order.to === enclave.id);
    
    const alertMarkers = activeDisasterMarkers.filter(m => m.targetEnclaveIds.includes(enclave.id));
    const affectedRoutes = routes.filter(r => 
        (r.from === enclave.id || r.to === enclave.id) && 
        (r.isDestroyed || r.disabledForTurns > 0)
    );

    let outgoingForceValue: number | string = '';

    // FIX: Add a defensive check to prevent a crash if the enclave's force count is
    // corrupted (e.g., NaN, undefined). This sanitizes the input before it's used
    // in mathematical calculations for outgoing orders.
    const safeCurrentForces = Number.isFinite(enclave.forces) ? enclave.forces : 0;

    if (outgoingOrder) {
        const { combatModifier } = getAppliedModifiers(enclave);

        if (outgoingOrder.type === 'attack') {
            const baseForces = Math.ceil(safeCurrentForces * (1/3));
            const bonus = 1 + getAttackBonusForEnclave(enclave);
            // FIX: Match the turn resolver logic: (forces * modifier) + bonus
            outgoingForceValue = Math.floor(baseForces * combatModifier) + bonus;
        } else if (outgoingOrder.type === 'assist') {
            const assistMultiplier = getAssistMultiplierForEnclave(enclave);
            const baseForces = Math.ceil(safeCurrentForces * assistMultiplier);
            outgoingForceValue = baseForces;
        }
    } else { // Holding
        if (enclave.owner) {
            const baseReinforcements = 2 + getHoldingBonusForEnclave(enclave);
            const { productionModifier } = getAppliedModifiers(enclave);
            outgoingForceValue = Math.floor(baseReinforcements * productionModifier);
        } else {
            outgoingForceValue = 0; // Neutrals don't reinforce
        }
    }
    
    const incomingOrderSubtitles: { [key: string]: string } = {
      attack: 'Attacking',
      assist: 'Assisting',
    };

    // FIX: Defensively get the target enclave to prevent a crash if the target
    // has been destroyed (e.g., by a disaster) but the order hasn't been pruned yet.
    const outgoingOrderTarget = outgoingOrder ? enclaveData[outgoingOrder.to] : null;

    return (
        <>
            <div className="sticky top-0 bg-neutral-900/80 backdrop-blur-sm z-10 flex-shrink-0">
                {enclave.owner !== null && (
                  <div className="w-full h-2 bg-neutral-800 overflow-hidden relative">
                    {isConfirming ? (<div className="h-full bg-[var(--color-accent-400)] animate-confirm-order"></div>)
                    : isSelected ? (<div className="h-full w-1/2 bg-[var(--color-accent-400)] absolute top-0 left-0 animate-indeterminate"></div>)
                    : null}
                  </div>
                )}
                <div role="button" onClick={() => onFocusEnclave(enclave.id)}>
                    <Card.Header 
                        icon={getIconForEntityType('enclave')}
                        iconColorHex={palette.icon}
                        title={enclave.name}
                        subtitle={domainData[enclave.domainId]?.name || 'Unknown Domain'}
                        value={Math.round(enclave.forces)}
                        valueType='force'
                        owner={enclave.owner}
                        worldPalette={currentWorld?.neutralColorPalette}
                    />
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto no-scrollbar" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
                <div className="w-full aspect-video">
                    <img 
                        src={getAssetUrl(enclave.imageUrl)}
                        className="w-full h-full object-cover"
                        alt={`Illustration of ${enclave.name}`}
                    />
                </div>

                {enclave.owner !== null ? (
                    <Card.Section title="Orders" hasContent={true}>
                        {outgoingOrder ? (
                            <ChipCard
                                icon={ORDER_PROFILES[outgoingOrder.type].icon}
                                iconColorHex={palette.icon}
                                value={outgoingForceValue}
                                valueType="force"
                                owner={enclave.owner}
                                worldPalette={currentWorld?.neutralColorPalette}
                                briefingProps={{ type: 'order', key: `order-${outgoingOrder.type}-${enclave.id}-${outgoingOrder.to}` }}
                                title={outgoingOrder.type === 'attack' ? 'Attacking' : 'Assisting'}
                                subtitle={outgoingOrderTarget ? outgoingOrderTarget.name : 'Unknown'}
                            />
                        ) : (
                            <ChipCard
                                icon={ORDER_PROFILES.holding.icon}
                                iconColorHex={palette.icon}
                                value={outgoingForceValue}
                                valueType="force"
                                owner={enclave.owner}
                                worldPalette={currentWorld?.neutralColorPalette}
                                briefingProps={{ type: 'order', key: `order-holding-${enclave.id}` }}
                                title="Holding"
                                subtitle={enclave.name}
                            />
                        )}
                    </Card.Section>
                ) : (
                    <Card.Section title="Description">
                        <p className="text-base text-neutral-300">The unconquered natives of this region are unable to issue orders.</p>
                    </Card.Section>
                )}

                <Card.Section title="Incoming" hasContent={incomingOrders.length > 0}>
                   {incomingOrders.map(([fromId, order]) => {
                      const fromEnclave = enclaveData[parseInt(fromId, 10)];
                      if (!fromEnclave) return null;
                      
                      const { combatModifier } = getAppliedModifiers(fromEnclave);

                      // FIX: Add a defensive check to prevent a crash if the originating
                      // enclave has a corrupted force count (e.g., NaN, undefined). This
                      // sanitizes the input before it's used in mathematical calculations.
                      const safeForces = Number.isFinite(fromEnclave.forces) ? fromEnclave.forces : 0;

                      let incomingForceValue: string | number = '';
                      if (order.type === 'attack') {
                          const baseForces = Math.ceil(safeForces * (1/3));
                          const bonus = 1 + getAttackBonusForEnclave(fromEnclave);
                          // FIX: Match the turn resolver logic: (forces * modifier) + bonus
                          incomingForceValue = Math.floor(baseForces * combatModifier) + bonus;
                      } else if (order.type === 'assist') {
                          const assistMultiplier = getAssistMultiplierForEnclave(fromEnclave);
                          const baseForces = Math.ceil(safeForces * assistMultiplier);
                          incomingForceValue = baseForces;
                      }
    
                      return (
                         <ChipCard
                            key={fromId}
                            icon={ORDER_PROFILES[order.type].icon}
                            value={incomingForceValue}
                            valueType="force"
                            owner={fromEnclave.owner}
                            worldPalette={currentWorld?.neutralColorPalette}
                            briefingProps={{ type: 'order', key: `order-${order.type}-${fromId}-${enclave.id}` }}
                            title={fromEnclave.name}
                            subtitle={incomingOrderSubtitles[order.type]}
                        />
                      );
                   })}
                </Card.Section>
                <Card.Section title="Active Effects" hasContent={enclave.activeEffects.length > 0 || alertMarkers.length > 0}>
                   {alertMarkers.map(marker => {
                       const profile = DISASTER_PROFILES[marker.profileKey];
                       if (!profile) return null;
                       return (
                           <ChipCard
                                key={marker.id}
                                icon={profile.ui.icon}
                                iconColorClass="text-amber-400"
                                value={marker.duration}
                                valueType="duration"
                                briefingProps={{ type: 'effect', key: `effect-${enclave.id}-${marker.id}` }}
                                title={profile.logic.alert.name}
                                subtitle={profile.ui.name}
                           />
                       );
                   })}
                   {enclave.activeEffects.map(effect => {
                      const profile = DISASTER_PROFILES[effect.profileKey];
                      if (!profile) return null;
                      const phaseName = effect.phase === 'alert' ? profile.logic.alert.name : (effect.phase === 'impact' ? profile.logic.impact.name : profile.logic.aftermath?.name);
                      const showDuration = effect.duration > 0;
                      return (
                         <ChipCard
                            key={effect.id}
                            icon={profile.ui.icon}
                            iconColorClass="text-amber-400"
                            value={showDuration ? effect.duration : undefined}
                            valueType="duration"
                            briefingProps={{ type: 'effect', key: `effect-${enclave.id}-${effect.id}` }}
                            title={phaseName}
                            subtitle={profile.ui.name}
                         />
                      );
                   })}
                </Card.Section>
                <Card.Section title="Routes" hasContent={affectedRoutes.length > 0}>
                    {affectedRoutes.map(route => {
                        const otherEnclaveId = route.from === enclave.id ? route.to : route.from;
                        const otherEnclave = enclaveData[otherEnclaveId];
                        if (!otherEnclave) return null;
    
                        const isDestroyed = route.isDestroyed;
                        const subtitle = isDestroyed ? 'Destroyed' : 'Disabled';
                        const statusType = isDestroyed ? 'destroyed' : 'disabled';
                        
                        const iconColorClass = isDestroyed ? `text-${THEME_CONFIG.danger}-500` : `text-${THEME_CONFIG.warning}-400`;
                        
                        return (
                            <ChipCard
                                key={`${route.from}-${route.to}`}
                                icon={getIconForRouteStatus(statusType)}
                                iconColorClass={iconColorClass}
                                title={otherEnclave.name}
                                subtitle={subtitle}
                                value={!isDestroyed && route.disabledForTurns > 0 ? route.disabledForTurns : undefined}
                                valueType="duration"
                                briefingProps={{ type: 'route', key: `route-${enclave.id}-${otherEnclaveId}` }}
                            />
                        );
                    })}
                </Card.Section>
            </div>
        </>
    );
};

export default EnclaveInspector;
