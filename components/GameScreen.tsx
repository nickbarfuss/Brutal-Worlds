

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import WorldCanvas from './WorldCanvas';
import PlayerDisplay from './PlayerDisplay';
import InspectorCard from './inspector/InspectorCard';
import Snackbar from './ui/Snackbar';
import BriefingCard from './briefing/BriefingCard';
import GameOverDialog from './GameOverDialog';
import GambitRail from './GambitRail';
import CinematicDisplay from './CinematicDisplay';
import { ORDER_PROFILES } from '../data/orders';
import { DISASTER_PROFILES } from '../data/disasters';
import { ARCHETYPES } from '../data/archetypes';
import { BIRTHRIGHTS } from '../data/birthrights';
// FIX: Import getIconForEntityType, which was missing and causing a reference error.
// ARCHITECTURAL FIX: Import the new getDomainOwner utility.
import { getIconForRouteStatus, getIconForEntityType, getDomainOwner } from '../utils/entityUtils';
import TurnDisplay from './TurnDisplay';
import WorldDisplay from './WorldDisplay';
import { PLAYER_THREE_COLORS, THEME_CONFIG } from '../data/theme';
import { useWorldHighlights } from '../hooks/useWorldHighlights';
import { BriefingContent, GameOverState, OrderType, Owner, WorldProfile } from '../types/game';
import Backdrop from './ui/Backdrop';
import LegendDisplay from './LegendDisplay';
import VignetteOverlay from './VignetteOverlay';
import { getAppliedModifiers } from '../logic/effectProcessor';
import { getAttackBonusForEnclave, getAssistMultiplierForEnclave, getHoldingBonusForEnclave } from '../logic/birthrightManager';
import CustomCursor from './ui/CustomCursor';
import SettingsDrawer from './SettingsDrawer';
import SurrenderConfirmDialog from './SurrenderConfirmDialog';

export type BriefingData = {
    content: BriefingContent;
    targetRect: DOMRect;
    type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile';
};

interface GameScreenProps {
    engine: ReturnType<typeof useGameEngine>;
}

const GameScreen: React.FC<GameScreenProps> = ({ engine }) => {
    const [briefing, setBriefing] = useState<BriefingData | null>(null);
    const [briefingTarget, setBriefingTarget] = useState<{ type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile', key: string } | null>(null);
    const [isClosingGameOver, setIsClosingGameOver] = useState(false);
    const [hasUiAnimatedIn, setHasUiAnimatedIn] = useState(false);
    const [isClosingSettings, setIsClosingSettings] = useState(false);
    const [isSurrenderConfirmOpen, setIsSurrenderConfirmOpen] = useState(false);
    const [isClosingSurrender, setIsClosingSurrender] = useState(false);
    const wasPausedBeforeSurrender = useRef(false);
    
    // Refs for all timeouts to prevent memory leaks on unmount.
    const newGameTimeoutRef = useRef<number | null>(null);
    const surrenderTimeoutRef = useRef<number | null>(null);
    const closeSettingsTimeoutRef = useRef<number | null>(null);
    const closeSurrenderTimeoutRef = useRef<number | null>(null);

    // This effect handles the initial fade-in of the UI after the cinematic intro.
    useEffect(() => {
        if (engine.isIntroComplete && !hasUiAnimatedIn) {
            const timeoutId = window.setTimeout(() => {
                setHasUiAnimatedIn(true);
            }, 200);

            // This cleanup function is tied to this specific effect run.
            // It will be called if the component unmounts OR if the dependencies change
            // before the timeout fires, preventing a state update on an unmounted component.
            return () => clearTimeout(timeoutId);
        }
    }, [engine.isIntroComplete, hasUiAnimatedIn]);

    // General cleanup effect for all timeouts.
    useEffect(() => {
        return () => {
            if (newGameTimeoutRef.current) clearTimeout(newGameTimeoutRef.current);
            if (surrenderTimeoutRef.current) clearTimeout(surrenderTimeoutRef.current);
            if (closeSettingsTimeoutRef.current) clearTimeout(closeSettingsTimeoutRef.current);
            if (closeSurrenderTimeoutRef.current) clearTimeout(closeSurrenderTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (engine.introStep === 'warp') {
            engine.sfxManager.playSound('game-warp-engage-1', 'fx');
        } else if (engine.introStep === 'zoom') {
            const soundKeys = ['game-warp-exit-1', 'game-warp-exit-2', 'game-warp-exit-3', 'game-warp-exit-4'];
            const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
            engine.sfxManager.playSound(randomKey, 'fx');
        }
    }, [engine.introStep, engine.sfxManager]);

    const { activeHighlight, convertLatLonToVector3, highlightBorderMeshes, highlightBorderMaterials, highlightBorderOpacity, permanentBorderMeshes, permanentBorderMaterials } = useWorldHighlights({
        mapData: engine.mapData,
        enclaveData: engine.enclaveData,
        domainData: engine.domainData,
        riftData: engine.riftData,
        expanseData: engine.expanseData,
        currentWorld: engine.currentWorld,
        activeHighlight: engine.activeHighlight,
        isIntroComplete: engine.isIntroComplete,
    });

    const showBriefing = useCallback((type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile', contentKey: string) => {
        setBriefingTarget({ type, key: contentKey });
    }, []);

    const hideBriefing = useCallback(() => {
        setBriefingTarget(null);
    }, []);

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

    const getBriefingContent = useCallback((type: 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile', key: string): BriefingContent | null => {
        if (type === 'order') {
            const parts = key.split('-');
            const orderType = parts[1] as OrderType | 'holding';
            const fromId = parseInt(parts[2], 10);
            const toId = parts.length > 3 ? parseInt(parts[3], 10) : null;
            
            const fromEnclave = engine.enclaveData[fromId];
            if (!fromEnclave) return null;
    
            // FIX: Sanitize the enclave's force count before performing any math on it.
            // This prevents NaN from propagating into the UI and causing a crash.
            const safeForces = Number.isFinite(fromEnclave.forces) ? fromEnclave.forces : 0;
            
            const fromArchetype = fromEnclave.archetypeKey ? ARCHETYPES[fromEnclave.archetypeKey] : null;
            const palette = getPaletteForOwner(fromEnclave.owner, engine.currentWorld);
    
            if (orderType === 'attack' || orderType === 'assist') {
                if (toId === null) return null;
                const toEnclave = engine.enclaveData[toId];
                if (!toEnclave) return null;
    
                const profile = ORDER_PROFILES[orderType];
                const content: BriefingContent = {
                    icon: profile.icon,
                    iconColorHex: palette.icon,
                    title: orderType === 'attack' ? 'Attacking' : 'Assisting',
                    subtitle: toEnclave.name,
                    description: profile.description,
                    effect: profile.effect,
                    owner: fromEnclave.owner,
                    worldPalette: engine.currentWorld?.neutralColorPalette,
                };
                
                if (orderType === 'attack') {
                    const baseForces = Math.ceil(safeForces * (1/3));
                    const bonus = 1 + getAttackBonusForEnclave(fromEnclave);
                    const { combatModifier } = getAppliedModifiers(fromEnclave);
                    content.value = Math.floor(baseForces * combatModifier) + bonus;
                    content.valueType = 'force';
                    
                    if (fromArchetype?.key === 'first-sword') {
                        const birthright = BIRTHRIGHTS[fromArchetype.birthrightKey];
                        content.birthright = {
                            name: birthright.name,
                            icon: birthright.icon,
                            effect: birthright.effect,
                        };
                    }
                } else { // assist
                    const assistMultiplier = getAssistMultiplierForEnclave(fromEnclave);
                    const baseForces = Math.ceil(safeForces * assistMultiplier);
                    content.value = baseForces;
                    content.valueType = 'force';

                    if (fromArchetype?.key === 'labyrinthine-ghost') {
                        const birthright = BIRTHRIGHTS[fromArchetype.birthrightKey];
                        content.birthright = {
                            name: birthright.name,
                            icon: birthright.icon,
                            effect: birthright.effect,
                        };
                    }
                }
                return content;
    
            } else if (orderType === 'holding') {
                const profile = ORDER_PROFILES.holding;
                const content: BriefingContent = {
                    icon: profile.icon,
                    iconColorHex: palette.icon,
                    title: 'Holding',
                    subtitle: fromEnclave.name,
                    description: profile.description,
                    effect: profile.effect,
                    owner: fromEnclave.owner,
                    worldPalette: engine.currentWorld?.neutralColorPalette,
                };
    
                let reinforcements = 0;
                if (fromEnclave.owner) { // Neutrals don't reinforce
                    const baseReinforcements = 2 + getHoldingBonusForEnclave(fromEnclave);
                    const { productionModifier } = getAppliedModifiers(fromEnclave);
                    reinforcements = Math.floor(baseReinforcements * productionModifier);
                }
    
                content.value = reinforcements;
                content.valueType = 'force';
    
                if (fromArchetype?.key === 'world-artificer' || fromArchetype?.key === 'pact-whisperer') {
                    const birthright = BIRTHRIGHTS[fromArchetype.birthrightKey];
                    content.birthright = {
                        name: birthright.name,
                        icon: birthright.icon,
                        effect: birthright.effect,
                    };
                }
                return content;
            }
            return null;
        }
        if (type === 'effect') {
            const parts = key.split('-');
            const enclaveId = parseInt(parts[1], 10);
            const effectOrMarkerId = parts.slice(2).join('-');
            
            const enclave = engine.enclaveData[enclaveId];
            if (!enclave) return null;
    
            const effect = enclave.activeEffects.find(e => e.id === effectOrMarkerId);
            const marker = engine.activeDisasterMarkers.find(m => m.id === effectOrMarkerId && m.targetEnclaveIds.includes(enclaveId));
    
            if (effect) {
                 const profile = DISASTER_PROFILES[effect.profileKey];
                 if (!profile) return null;
                 
                 const phaseKey = effect.phase;
                 const phaseProfile = profile.logic[phaseKey];
                 if (!phaseProfile) return null;
                 
                 return {
                     icon: profile.ui.icon,
                     iconColorClass: 'text-amber-400',
                     title: phaseProfile.name,
                     subtitle: profile.ui.name,
                     description: phaseProfile.description,
                     effect: phaseProfile.effect,
                     value: effect.duration,
                     valueType: 'duration'
                 };
            } else if (marker) {
                const profile = DISASTER_PROFILES[marker.profileKey];
                if (!profile) return null;
                const alertProfile = profile.logic.alert;
                return {
                    icon: profile.ui.icon,
                    iconColorClass: 'text-amber-400',
                    title: alertProfile.name,
                    subtitle: profile.ui.name,
                    description: alertProfile.description,
                    effect: alertProfile.effect,
                    value: marker.duration,
                    valueType: 'duration'
                }
            }
            return null;
        }
        if (type === 'disasterProfile') {
            const profile = DISASTER_PROFILES[key];
            if (!profile) return null;
        
            // Calculate total duration for the header
            let minDuration = 0;
            let maxDuration = 0;
            if (profile.logic.alert) {
                minDuration += profile.logic.alert.duration;
                maxDuration += profile.logic.alert.duration;
            }
            if (profile.logic.impact) {
                minDuration += profile.logic.impact.duration;
                maxDuration += profile.logic.impact.duration;
            }
            if (profile.logic.aftermath) {
                minDuration += profile.logic.aftermath.duration[0];
                maxDuration += profile.logic.aftermath.duration[1];
            }
            const totalDurationString = minDuration === maxDuration ? `${minDuration}` : `${minDuration}-${maxDuration}`;
        
            const getPhaseDuration = (duration: number | [number, number]): string => {
                if (Array.isArray(duration)) {
                    return `${duration[0]}-${duration[1]}`;
                }
                return String(duration);
            };
        
            return {
                icon: profile.ui.icon,
                iconColorClass: 'text-amber-400',
                title: profile.ui.name,
                disasterDescription: profile.ui.description,
                value: totalDurationString,
                valueType: 'duration',
                alertPhase: profile.logic.alert ? { name: profile.logic.alert.name, effect: profile.logic.alert.effect, duration: getPhaseDuration(profile.logic.alert.duration) } : undefined,
                impactPhase: profile.logic.impact ? { name: profile.logic.impact.name, effect: profile.logic.impact.effect, duration: getPhaseDuration(profile.logic.impact.duration) } : undefined,
                aftermathPhase: profile.logic.aftermath ? { name: profile.logic.aftermath.name, effect: profile.logic.aftermath.effect, duration: getPhaseDuration(profile.logic.aftermath.duration) } : undefined
            };
        }
        if (type === 'route') {
            const [, fromIdStr, toIdStr] = key.split('-');
            const fromId = parseInt(fromIdStr, 10);
            const toId = parseInt(toIdStr, 10);
            const route = engine.routes.find(r => (r.from === fromId && r.to === toId) || (r.to === fromId && r.from === toId));
            if (!route) return null;

            const inspectingEnclave = engine.enclaveData[fromId];
            if (!inspectingEnclave) return null;

            const otherEnclave = engine.enclaveData[toId];
            if (!otherEnclave) return null;

            const isDestroyed = route.isDestroyed;
            const subtitle = isDestroyed ? 'Destroyed' : 'Disabled';
            const icon = getIconForRouteStatus(isDestroyed ? 'destroyed' : 'disabled');
            const iconColorClass = isDestroyed ? `text-${THEME_CONFIG.danger}-500` : `text-${THEME_CONFIG.warning}-400`;

            return {
                icon: icon,
                iconColorClass: iconColorClass,
                title: otherEnclave.name,
                subtitle: subtitle,
                description: isDestroyed
                    ? 'This route has been permanently destroyed and cannot be used.'
                    : `This route is temporarily disabled and will be usable again in ${route.disabledForTurns} turn(s).`,
                value: !isDestroyed && route.disabledForTurns > 0 ? route.disabledForTurns : undefined,
                valueType: 'duration'
            };
        }
        if (type === 'domain' && engine.currentWorld) {
            const domainEntry = Object.entries(engine.domainData).find(([, d]) => d.name === key);
            if (!domainEntry) return null;
            const [domainId, domain] = domainEntry;
            
            const enclavesInDomain = Object.values(engine.enclaveData).filter(e => e.domainId === parseInt(domainId, 10));
            // FIX: Ensure forces are sanitized before being reduced to prevent a single NaN
            // from poisoning the entire sum.
            const totalForces = enclavesInDomain.reduce((acc, e) => acc + (Number.isFinite(e.forces) ? e.forces : 0), 0);
    
            const enclavesByOwner: BriefingContent['enclavesByOwner'] = {};
            enclavesInDomain.forEach(e => {
                const ownerKey = String(e.owner);
                if (!enclavesByOwner[ownerKey]) enclavesByOwner[ownerKey] = [];
                // FIX: Sanitize forces here as well for the detailed breakdown.
                enclavesByOwner[ownerKey].push({ id: e.id, name: e.name, forces: Number.isFinite(e.forces) ? e.forces : 0, owner: e.owner });
            });
    
            const ownerForces: BriefingContent['ownerForces'] = Object.entries(enclavesByOwner).map(([ownerKey, enclaves]) => ({
                owner: ownerKey === 'null' ? null : ownerKey as Owner,
                forces: enclaves.reduce((acc, e) => acc + e.forces, 0)
            }));
    
            const domainOwner = getDomainOwner(parseInt(domainId, 10), engine.enclaveData);
            const isContested = new Set(enclavesInDomain.map(e => e.owner)).size > 1;

            let subtitle: string;
            if (isContested) {
                subtitle = 'Contested Domain';
            } else if (domainOwner === null) {
                subtitle = 'Neutral Domain';
            } else {
                subtitle = 'Controlled Domain';
            }
    
            return {
                icon: getIconForEntityType('domain'),
                iconColorHex: engine.currentWorld.neutralColorPalette.icon,
                title: domain.name,
                subtitle: subtitle,
                enclaves: enclavesInDomain.map(e => ({ id: e.id, name: e.name, forces: Number.isFinite(e.forces) ? e.forces : 0, owner: e.owner })),
                value: totalForces,
                valueType: 'force',
                owner: domainOwner,
                worldPalette: engine.currentWorld.neutralColorPalette,
                ownerForces: ownerForces,
                isContested: isContested,
                enclavesByOwner: enclavesByOwner
            };
        }
        return null;
    }, [engine.enclaveData, engine.domainData, engine.routes, engine.activeDisasterMarkers, engine.currentWorld]);

    useEffect(() => {
        const target = document.querySelector(`[data-briefing-key="${briefingTarget?.key}"]`);
        if (target) {
            const content = getBriefingContent(briefingTarget.type, briefingTarget.key);
            if (content) {
                setBriefing({ content, targetRect: target.getBoundingClientRect(), type: briefingTarget.type });
            }
        } else {
            setBriefing(null);
        }
    }, [briefingTarget, getBriefingContent]);

    const handleNewGame = () => {
        setIsClosingGameOver(true);
        if (newGameTimeoutRef.current) clearTimeout(newGameTimeoutRef.current);
        newGameTimeoutRef.current = window.setTimeout(() => {
            engine.resetGame();
            setIsClosingGameOver(false);
        }, 300);
    };
    
    const handleSurrender = () => {
        if (!engine.isPaused) {
            wasPausedBeforeSurrender.current = false;
            engine.togglePause();
        } else {
            wasPausedBeforeSurrender.current = true;
        }
        setIsSurrenderConfirmOpen(true);
    };

    const handleConfirmSurrender = () => {
        setIsClosingSurrender(true);
        if (surrenderTimeoutRef.current) clearTimeout(surrenderTimeoutRef.current);
        surrenderTimeoutRef.current = window.setTimeout(() => {
            engine.goToMainMenu();
            setIsSurrenderConfirmOpen(false);
            setIsClosingSurrender(false);
        }, 300);
    };
    
    const handleCancelSurrender = () => {
        setIsClosingSurrender(true);
        if (closeSurrenderTimeoutRef.current) clearTimeout(closeSurrenderTimeoutRef.current);
        closeSurrenderTimeoutRef.current = window.setTimeout(() => {
            if (!wasPausedBeforeSurrender.current) {
                engine.togglePause();
            }
            setIsSurrenderConfirmOpen(false);
            setIsClosingSurrender(false);
        }, 300);
    };

    const handleToggleSettings = () => {
        if (engine.isSettingsOpen) {
            setIsClosingSettings(true);
            if (closeSettingsTimeoutRef.current) clearTimeout(closeSettingsTimeoutRef.current);
            closeSettingsTimeoutRef.current = window.setTimeout(() => {
                engine.toggleSettingsDrawer();
                setIsClosingSettings(false);
            }, 200);
        } else {
            engine.toggleSettingsDrawer();
        }
    };
    
    const enclaves = Object.values(engine.enclaveData);
    const totalEnclaves = enclaves.length;
    const playerEnclaves = enclaves.filter(e => e.owner === 'player-1').length;
    const opponentEnclaves = enclaves.filter(e => e.owner === 'player-2').length;
    const neutralEnclaves = totalEnclaves - playerEnclaves - opponentEnclaves;

    const playerPercentage = totalEnclaves > 0 ? playerEnclaves / totalEnclaves : 0;
    const opponentPercentage = totalEnclaves > 0 ? opponentEnclaves / totalEnclaves : 0;
    const neutralPercentage = 1 - playerPercentage - opponentPercentage;
    
    const uiAnimationClass = hasUiAnimatedIn ? 'opacity-100' : 'opacity-0';
    const uiTransitionClass = 'transition-opacity duration-1000';
    
    // ARCHITECTURAL FIX: The game's outcome is now determined solely by the authoritative
    // `gameOverState` from the turn resolver. This removes the local recalculation
    // which was a source of state inconsistency.
    const showGameOverDialog = engine.gameOverState !== 'none' || isClosingGameOver;
    
    const cursorClass = useMemo(() => {
        if (engine.isResolvingTurn) return 'cursor-none'; // Use CSS to show a spinner

        if (engine.selectedEnclaveId !== null) {
            const originEnclave = engine.enclaveData[engine.selectedEnclaveId];
            if (!originEnclave) return '';

            const hoveredEnclave = engine.mapData[engine.hoveredCellId]?.enclaveId !== null
                ? engine.enclaveData[engine.mapData[engine.hoveredCellId].enclaveId]
                : null;
            
            if (hoveredEnclave && hoveredEnclave.id !== engine.selectedEnclaveId) {
                const route = engine.routes.find(r =>
                    ((r.from === engine.selectedEnclaveId && r.to === hoveredEnclave.id) ||
                     (r.to === engine.selectedEnclaveId && r.from === hoveredEnclave.id)) &&
                    !r.isDestroyed &&
                    r.disabledForTurns <= 0
                );
                if (route) {
                    if (hoveredEnclave.owner === originEnclave.owner) {
                        // FIX: Sanitize the force count before this calculation.
                        const safeForces = Number.isFinite(originEnclave.forces) ? originEnclave.forces : 0;
                        const assistMultiplier = getAssistMultiplierForEnclave(originEnclave);
                        const forceToSend = Math.ceil(safeForces * assistMultiplier);
                        return (safeForces - forceToSend <= 0) ? 'cursor-order-invalid' : 'cursor-order-assist';
                    }
                    return 'cursor-order-attack';
                }
            }
             return 'cursor-order-invalid';
        }
        return '';
    }, [engine.selectedEnclaveId, engine.hoveredCellId, engine.enclaveData, engine.mapData, engine.routes, engine.isResolvingTurn]);


    return (
        <div className={`w-full h-full relative ${cursorClass}`}>
            <WorldCanvas
                gameState={engine}
                vfxManager={engine.vfxManager}
                onIntroStepComplete={engine.onIntroStepComplete}
                convertLatLonToVector3={convertLatLonToVector3}
                highlightBorderMeshes={highlightBorderMeshes}
                highlightBorderMaterials={highlightBorderMaterials}
                activeHighlight={activeHighlight}
                highlightBorderOpacity={highlightBorderOpacity}
                permanentBorderMeshes={permanentBorderMeshes}
                permanentBorderMaterials={permanentBorderMaterials}
            />

            <CinematicDisplay introStep={engine.introStep} planetName={engine.planetName} worldColor={engine.currentWorld?.worldColor || '#ffffff'} />
            <VignetteOverlay />
            {engine.isResolvingTurn && <CustomCursor />}
            
            <div className={`absolute inset-0 p-8 flex flex-col justify-between pointer-events-none ${uiAnimationClass} ${uiTransitionClass}`}>
                {/* Top Row */}
                <div className="flex justify-between items-start">
                    <PlayerDisplay owner="player-1" archetypeKey={engine.playerArchetypeKey} skinIndex={engine.playerArchetypeSkinIndex} />
                    <div className="flex flex-col items-center gap-4">
                        <TurnDisplay
                           playerPercentage={playerPercentage}
                           opponentPercentage={opponentPercentage}
                           neutralPercentage={neutralPercentage}
                           playerColor={PLAYER_THREE_COLORS['player-1'].selected}
                           opponentColor={PLAYER_THREE_COLORS['player-2'].selected}
                           neutralColor={engine.currentWorld?.neutralColorPalette.selected || '#525252'}
                           currentTurn={engine.currentTurn}
                           turnDuration={engine.gameConfig.TURN_DURATION}
                           isPaused={engine.isPaused}
                           isGameOver={engine.gameOverState !== 'none'}
                           isResolvingTurn={engine.isResolvingTurn}
                           togglePause={engine.togglePause}
                        />
                        <LegendDisplay
                           enclaveData={engine.enclaveData}
                           domainData={engine.domainData}
                           riftData={engine.riftData}
                           expanseData={engine.expanseData}
                           currentWorld={engine.currentWorld}
                           activeHighlight={engine.activeHighlight}
                           onHighlightChange={engine.setActiveHighlight}
                           isWorldInspected={engine.inspectedEntity?.type === 'world'}
                           onInspectWorld={() => engine.setInspectedEntity(engine.inspectedEntity?.type === 'world' ? null : { type: 'world' })}
                        />
                    </div>
                    <WorldDisplay
                        planetName={engine.planetName}
                        hoveredEntity={engine.hoveredEntity}
                        isIntroComplete={engine.isIntroComplete}
                        onSurrender={handleSurrender}
                        onToggleSettings={handleToggleSettings}
                    />
                </div>
                {/* Bottom Row */}
                <div className="flex justify-between items-end">
                    <div className="w-1/3">
                        {/* Reserved for Player 1 Gambits */}
                    </div>
                    <div className="w-1/3">
                         {engine.latestDisaster && (
                            <Snackbar
                                data={{
                                    icon: engine.latestDisaster.profile.ui.icon,
                                    title: engine.latestDisaster.profile.ui.name,
                                    subtitle: `has been reported in ${engine.latestDisaster.locationName}.`,
                                    iconColorClass: 'text-amber-400',
                                }}
                                duration={5}
                                onClose={engine.clearLatestDisaster}
                            />
                        )}
                    </div>
                    <div className="w-1/3 flex justify-end">
                        <PlayerDisplay owner="player-2" archetypeKey={engine.opponentArchetypeKey} skinIndex={engine.opponentArchetypeSkinIndex}/>
                    </div>
                </div>
            </div>

            <InspectorCard
                isVisible={engine.isCardVisible}
                inspectedEntity={engine.inspectedEntity}
                selectedEnclaveId={engine.selectedEnclaveId}
                enclaveData={engine.enclaveData}
                domainData={engine.domainData}
                riftData={engine.riftData}
                expanseData={engine.expanseData}
                pendingOrders={engine.pendingOrders}
                routes={engine.routes}
                currentWorld={engine.currentWorld}
                activeDisasterMarkers={engine.activeDisasterMarkers}
                onFocusEnclave={engine.focusOnEnclave}
                onShowBriefing={showBriefing}
                onHideBriefing={hideBriefing}
                onTriggerDisaster={engine.triggerDisaster}
            />
            
            <BriefingCard briefing={briefing} world={engine.currentWorld} />

            {showGameOverDialog && (
                <>
                    <Backdrop isClosing={isClosingGameOver} />
                    <GameOverDialog
                        gameOverState={engine.gameOverState}
                        onNewGame={handleNewGame}
                        isClosing={isClosingGameOver}
                    />
                </>
            )}
            
            {(isSurrenderConfirmOpen || isClosingSurrender) && (
                <>
                    <Backdrop isClosing={isClosingSurrender} />
                    <SurrenderConfirmDialog
                        onConfirm={handleConfirmSurrender}
                        onCancel={handleCancelSurrender}
                        isClosing={isClosingSurrender}
                        planetName={engine.planetName}
                    />
                </>
            )}

            <SettingsDrawer
                isOpen={engine.isSettingsOpen}
                isClosing={isClosingSettings}
                onClose={handleToggleSettings}
                volumes={engine.volumes}
                onVolumeChange={engine.setVolume}
                mutedChannels={engine.mutedChannels}
                onToggleMute={engine.toggleMuteChannel}
                isBloomEnabled={engine.isBloomEnabled}
                onToggleBloom={engine.setBloomEnabled}
                bloomSettings={engine.bloomSettings}
                onBloomSettingChange={engine.setBloomValue}
                materialSettings={engine.materialSettings}
                onMaterialSettingChange={engine.setMaterialValue}
                ambientLightIntensity={engine.ambientLightIntensity}
                onAmbientLightIntensityChange={engine.setAmbientLightIntensity}
                tonemappingStrength={engine.tonemappingStrength}
                onTonemappingStrengthChange={engine.setTonemappingStrength}
            />
        </div>
    );
};

export default GameScreen;