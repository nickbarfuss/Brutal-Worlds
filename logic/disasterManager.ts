

import { Enclave, Domain, MapCell, Expanse, ActiveDisasterMarker, EffectRules, ActiveEffect, Route } from '../types/game.ts';
import { DisasterProfile } from '../types/profiles.ts';
import { DISASTER_PROFILES } from '../data/disasters.ts';
import * as THREE from 'three';
import { applyInstantaneousRules, applyContinuousRules } from './effectProcessor.ts';

interface TriggerContext {
    enclaveData: { [id: number]: Enclave };
    domainData: { [id: number]: Domain };
    mapData: MapCell[];
    expanseData: { [id: number]: Expanse };
}

const applyAlertsToEnclaves = (
    key: string,
    profile: DisasterProfile,
    affectedEnclaveIds: number[],
    enclaveData: { [id: number]: Enclave },
    metadata: any = {}
): { [id: number]: Enclave } => {
    // FIX: Create a shallow copy of the main enclave data object to avoid direct state mutation.
    const newEnclaveStates = { ...enclaveData };
    
    affectedEnclaveIds.forEach(enclaveId => {
        const originalEnclave = newEnclaveStates[enclaveId];
        if (!originalEnclave) return;

        // Create a deep enough copy of the specific enclave being modified.
        const enclave = {
            ...originalEnclave,
            activeEffects: [...(originalEnclave.activeEffects || [])],
            vfxToPlayThisTurn: [...(originalEnclave.vfxToPlayThisTurn || [])],
        };

        const alert = profile.logic.alert;
        const alreadyHasAlert = enclave.activeEffects.some((e: ActiveEffect) => e.profileKey === key && e.phase === 'alert');

        if (!alreadyHasAlert) {
            enclave.activeEffects.push({
                id: `eff-${key}-${enclaveId}-${Date.now()}`,
                profileKey: key,
                icon: profile.ui.icon,
                duration: alert.duration,
                maxDuration: alert.duration,
                phase: 'alert',
                rules: alert.rules,
                metadata, // Attach metadata for radius-based aftermath effects
            });

            if (alert.vfx) {
                enclave.vfxToPlayThisTurn.push(`${key}-alert`);
            }
        }
        
        // Place the new, modified enclave object back into the new state object.
        newEnclaveStates[enclaveId] = enclave;
    });

    return newEnclaveStates;
};


export const triggerNewDisaster = (key: string, context: TriggerContext) => {
    const profile = DISASTER_PROFILES[key];
    if (!profile) return null;

    const { enclaveData, domainData, mapData, expanseData } = context;
    const allEnclaveIds = Object.keys(enclaveData).map(Number);
    if (allEnclaveIds.length === 0) return null;

    let snackbarData: { profile: DisasterProfile, locationName: string };
    const targetType = profile.logic.target;
    
    // Handle global disasters that apply alerts directly to enclaves
    if (targetType === 'Global') {
        const affectedEnclaveIds: number[] = [];
        let locationName = "multiple locations";

        const impactRules = profile.logic.impact.rules as Extract<EffectRules, { type: 'forceDamage' }>;
        if (impactRules.targets) {
            const numTargets = impactRules.targets();
            const shuffled = [...allEnclaveIds].sort(() => 0.5 - Math.random());
            shuffled.slice(0, numTargets).forEach(id => affectedEnclaveIds.push(id));
        }

        if (affectedEnclaveIds.length > 0) {
            const updatedEnclaves = applyAlertsToEnclaves(key, profile, affectedEnclaveIds, enclaveData);
            snackbarData = { profile, locationName };
            return { updatedEnclaves, snackbarData };
        }
        return null;
    }
    
    // Handle location-based disasters that create a temporary marker as the single source of truth for the alert phase.
    let originPosition: THREE.Vector3 | null = null;
    let locationName = "an unknown region";
    const targetEnclaveIds = new Set<number>();
    let metadata: any = {};
    
    if (targetType === 'Expanse') {
        const validExpanseIds = Object.keys(expanseData).filter(id => {
            const expanseCellIds = new Set(mapData.filter(c => c.voidId === parseInt(id, 10)).map(c => c.id));
            return Array.from(expanseCellIds).some(cellId => 
                mapData[cellId].neighbors.some(nId => mapData[nId].enclaveId !== null)
            );
        });

        if (validExpanseIds.length > 0) {
            const randomExpanseId = validExpanseIds[Math.floor(Math.random() * validExpanseIds.length)];
            const expanse = expanseData[parseInt(randomExpanseId, 10)];
            locationName = expanse.name;
            originPosition = expanse.center.clone();
            
            const expanseCellIds = new Set(mapData.filter(c => c.voidId === expanse.id).map(c => c.id));
            expanseCellIds.forEach(cellId => {
                mapData[cellId].neighbors.forEach(neighborId => {
                    const neighborCell = mapData[neighborId];
                    if (neighborCell.enclaveId !== null) {
                        targetEnclaveIds.add(neighborCell.enclaveId);
                    }
                });
            });
        }
    } else if (targetType === 'Domain') {
         const allDomainIds = Object.keys(domainData).map(Number);
         if (allDomainIds.length > 0) {
            const randomDomainId = allDomainIds[Math.floor(Math.random() * allDomainIds.length)];
            const domain = domainData[randomDomainId];
            locationName = domain.name;
            originPosition = domain.center.clone();
            
            Object.values(enclaveData).forEach(e => {
                if (e.domainId === randomDomainId) {
                    targetEnclaveIds.add(e.id);
                }
            });
         }
    } else if (targetType === 'Enclave' || targetType === 'Path') {
        const randomEnclaveId = allEnclaveIds[Math.floor(Math.random() * allEnclaveIds.length)];
        const enclave = enclaveData[randomEnclaveId];
        locationName = enclave.name;
        originPosition = enclave.center.clone();
        targetEnclaveIds.add(enclave.id);
    }
    
    if (originPosition) {
         const impactRules = profile.logic.impact.rules as Extract<EffectRules, { type: 'forceDamage' }>;
         if (impactRules.radius) {
            const radiusValue = impactRules.radius();
            // Store a serializable version of the origin vector
            metadata = { origin: { x: originPosition.x, y: originPosition.y, z: originPosition.z }, radius: radiusValue };
            
            // Override targets based on radius
            targetEnclaveIds.clear();
            Object.values(enclaveData).forEach(enclave => {
                if (originPosition!.distanceTo(enclave.center) <= radiusValue) {
                    targetEnclaveIds.add(enclave.id);
                }
            });
         }
    }
    
    if (originPosition && targetEnclaveIds.size > 0) {
        const newMarker: ActiveDisasterMarker = {
            id: `dis-marker-${key}-${Date.now()}`,
            profileKey: key,
            icon: profile.ui.icon,
            position: originPosition,
            duration: profile.logic.alert.duration,
            targetEnclaveIds: Array.from(targetEnclaveIds),
            metadata,
        };
        snackbarData = { profile, locationName };
        
        // For location-based disasters, we only return the marker.
        // The turn resolver is now responsible for processing it.
        return { newMarker, snackbarData };
    }

    return null;
};

export const processDisasterEffects = (
    initialEnclaveStates: { [id: number]: Enclave },
    initialRoutes: Route[],
    currentMarkers: ActiveDisasterMarker[]
): {
    newEnclaveStates: { [id: number]: Enclave };
    newRoutes: Route[];
    remainingDisasterMarkers: ActiveDisasterMarker[];
} => {
    let newEnclaveStates = initialEnclaveStates;
    let newRoutes = initialRoutes;
    const remainingDisasterMarkers: ActiveDisasterMarker[] = [];

    // Step 1: Apply continuous effects and collect expiring effects
    const expiringEffectsThisTurn: (ActiveEffect & { enclaveId: number })[] = [];
    const remainingEffectsByEnclave: { [enclaveId: number]: ActiveEffect[] } = {};

    for (const enclaveIdStr of Object.keys(newEnclaveStates)) {
        const enclaveId = Number(enclaveIdStr);
        let currentEnclave = newEnclaveStates[enclaveId];
        remainingEffectsByEnclave[enclaveId] = [];
        
        if (!currentEnclave.activeEffects || currentEnclave.activeEffects.length === 0) {
            continue;
        }

        for (const effect of currentEnclave.activeEffects) {
            const continuousResult = applyContinuousRules(effect.rules, currentEnclave, newRoutes);
            currentEnclave = continuousResult.enclave;
            newRoutes = continuousResult.routes;

            const profile = DISASTER_PROFILES[effect.profileKey];
            // FIX: Add a defensive check for `effect.rules` before accessing it.
            // This prevents a TypeError if an effect exists without its rules being re-hydrated,
            // which could crash the web worker and cause an 'Uncaught' error.
            if (profile && profile.logic.handler === 'moveEntropyWind' && effect.phase === 'aftermath' && effect.rules && 'retriggerChance' in effect.rules) {
                // FIX: Restructured logic to ensure that if the wind fails to move for *any*
                // reason (either failing the random check, or succeeding but finding no valid
                // routes), it correctly applies its secondary damage effect. This prevents the
                // disaster from entering an undefined state that could cause a crash.
                let movedSuccessfully = false;
                if (Math.random() < (effect.rules as any).retriggerChance) {
                    const connectedRoutes = newRoutes.filter(
                        r => (r.from === currentEnclave.id || r.to === currentEnclave.id) && !r.isDestroyed
                    );
                    if (connectedRoutes.length > 0) {
                        const routeToTravel = connectedRoutes[Math.floor(Math.random() * connectedRoutes.length)];
                        const nextEnclaveId = routeToTravel.from === currentEnclave.id ? routeToTravel.to : routeToTravel.from;
                        let nextEnclave = newEnclaveStates[nextEnclaveId];
                        
                        if (nextEnclave) {
                            // Per user feedback, the Entropy Wind is intended to permanently
                            // destroy the route it travels over.
                            routeToTravel.isDestroyed = true;
                            
                            const impact = profile.logic.impact;
                            const result = applyInstantaneousRules(impact.rules, nextEnclave, newRoutes, impact.duration);
                            
                            let updatedNextEnclave = result.enclave;
                            newRoutes = result.routes;
                            
                            if (!updatedNextEnclave.activeEffects) updatedNextEnclave.activeEffects = [];
                            updatedNextEnclave.activeEffects.push({
                                id: `eff-${effect.profileKey}-${nextEnclaveId}-${Date.now()}`,
                                profileKey: effect.profileKey, icon: profile.ui.icon,
                                duration: impact.duration, maxDuration: impact.duration,
                                phase: 'impact', rules: impact.rules,
                            });
                            
                            if (impact.vfx) {
                                if (!updatedNextEnclave.vfxToPlayThisTurn) updatedNextEnclave.vfxToPlayThisTurn = [];
                                updatedNextEnclave.vfxToPlayThisTurn.push(`${effect.profileKey}-impact`);
                            }
                            
                            newEnclaveStates[nextEnclaveId] = updatedNextEnclave;
                            effect.duration = 0; // Consume this effect
                            movedSuccessfully = true;
                        }
                    }
                }
                
                // If the wind failed to move (either by chance or lack of routes), apply damage.
                if (!movedSuccessfully) {
                    const damageRule: EffectRules = { type: 'forceDamage', percentage: 0.25 };
                    const result = applyInstantaneousRules(damageRule, currentEnclave, newRoutes);
                    currentEnclave = result.enclave;
                    // FIX: Critical bug where route modifications from the damage effect were not
                    // being propagated back into the main state.
                    newRoutes = result.routes;
                }
            }

            const decrementedEffect = { ...effect, duration: effect.duration - 1 };
            if (decrementedEffect.duration <= 0) {
                expiringEffectsThisTurn.push({ ...decrementedEffect, enclaveId });
            } else {
                remainingEffectsByEnclave[enclaveId].push(decrementedEffect);
            }
        }
        newEnclaveStates[enclaveId] = currentEnclave; // Update state after continuous effects
    }

    // Step 2: Group expiring radius events
    const expiringRadiusImpacts = new Map<string, (ActiveEffect & { enclaveId: number })[]>();
    const otherExpiringEffects = expiringEffectsThisTurn.filter(effect => {
        const originalMarkerId = effect.metadata?.originalMarkerId;
        const isRadiusImpact = effect.phase === 'impact' && effect.metadata?.radius && originalMarkerId;
        if (isRadiusImpact) {
            if (!expiringRadiusImpacts.has(originalMarkerId)) {
                expiringRadiusImpacts.set(originalMarkerId, []);
            }
            expiringRadiusImpacts.get(originalMarkerId)!.push(effect);
            return false;
        }
        return true;
    });

    // Step 3: Process the grouped radius events atomically
    for (const [originalMarkerId, effects] of expiringRadiusImpacts.entries()) {
        const firstEffect = effects[0];
        const profile = DISASTER_PROFILES[firstEffect.profileKey];
        if (!profile?.logic.aftermath) continue;

        const aftermathProfile = profile.logic.aftermath;
        const origin = new THREE.Vector3(firstEffect.metadata.origin.x, firstEffect.metadata.origin.y, firstEffect.metadata.origin.z);
        const impactRadius = firstEffect.metadata.radius;
        let aftermathRadius = impactRadius;
        if (aftermathProfile.rules.radius && typeof aftermathProfile.rules.radius === 'function') {
            aftermathRadius = aftermathProfile.rules.radius(impactRadius);
        }
        
        const enclavesInAftermathRadius = Object.values(newEnclaveStates).filter(e => origin.distanceTo(e.center) <= aftermathRadius);
        
        for (const targetEnclave of enclavesInAftermathRadius) {
            let currentTargetEnclave = newEnclaveStates[targetEnclave.id];
            if (!currentTargetEnclave) continue;

            let duration;
            if (Array.isArray(aftermathProfile.duration)) {
                const [min, max] = aftermathProfile.duration;
                duration = Math.floor(Math.random() * (max - min + 1)) + min;
            } else {
                duration = aftermathProfile.duration;
            }
            
            // FIX: Pass the calculated duration to applyInstantaneousRules to ensure
            // effects like route disruption last for the correct amount of time.
            const instantResult = applyInstantaneousRules(aftermathProfile.rules, currentTargetEnclave, newRoutes, duration);
            currentTargetEnclave = instantResult.enclave;
            newRoutes = instantResult.routes;
            
            if (!remainingEffectsByEnclave[currentTargetEnclave.id]) remainingEffectsByEnclave[currentTargetEnclave.id] = [];
            remainingEffectsByEnclave[currentTargetEnclave.id].push({
                id: `eff-${firstEffect.profileKey}-${currentTargetEnclave.id}-${Date.now()}`,
                profileKey: firstEffect.profileKey, icon: profile.ui.icon,
                duration, maxDuration: duration, phase: 'aftermath',
                rules: aftermathProfile.rules, metadata: firstEffect.metadata,
            });

            if (aftermathProfile.vfx) {
                if (!currentTargetEnclave.vfxToPlayThisTurn) currentTargetEnclave.vfxToPlayThisTurn = [];
                currentTargetEnclave.vfxToPlayThisTurn.push(`${firstEffect.profileKey}-aftermath`);
            }
            newEnclaveStates[currentTargetEnclave.id] = currentTargetEnclave;
        }
    }
    
    // Step 4: Process other expiring effects (single-target phase transitions)
    for (const effect of otherExpiringEffects) {
        const profile = DISASTER_PROFILES[effect.profileKey];
        if (!profile) continue;

        let nextPhase: 'impact' | 'aftermath' | null = null;
        if (effect.phase === 'alert') nextPhase = 'impact';
        else if (effect.phase === 'impact') nextPhase = profile.logic.aftermath ? 'aftermath' : null;

        if (nextPhase) {
            const phaseProfile = profile.logic[nextPhase]!;
            let currentEnclave = newEnclaveStates[effect.enclaveId];

            // FIX: Add a defensive check. It's possible for an enclave to be neutralized or
            // for its state to become inconsistent during complex turn resolutions.
            // This prevents a crash if we try to apply an effect to a non-existent enclave.
            if (!currentEnclave) continue;

            let duration: number;
            if (Array.isArray(phaseProfile.duration)) {
                const [min, max] = phaseProfile.duration;
                duration = Math.floor(Math.random() * (max - min + 1)) + min;
            } else { duration = phaseProfile.duration; }

            const instantResult = applyInstantaneousRules(phaseProfile.rules, currentEnclave, newRoutes, duration);
            currentEnclave = instantResult.enclave;
            newRoutes = instantResult.routes;
            
            if (!remainingEffectsByEnclave[currentEnclave.id]) remainingEffectsByEnclave[currentEnclave.id] = [];
            remainingEffectsByEnclave[currentEnclave.id].push({
                id: `eff-${effect.profileKey}-${currentEnclave.id}-${Date.now()}`,
                profileKey: effect.profileKey,
                icon: profile.ui.icon,
                duration,
                maxDuration: duration,
                phase: nextPhase,
                rules: phaseProfile.rules,
                metadata: effect.metadata,
            });

            if (phaseProfile.vfx) {
                if (!currentEnclave.vfxToPlayThisTurn) currentEnclave.vfxToPlayThisTurn = [];
                currentEnclave.vfxToPlayThisTurn.push(`${effect.profileKey}-${nextPhase}`);
            }
             if (phaseProfile.sfx) {
                if (!currentEnclave.sfxToPlayThisTurn) currentEnclave.sfxToPlayThisTurn = [];
                currentEnclave.sfxToPlayThisTurn.push(phaseProfile.sfx);
            }
            newEnclaveStates[effect.enclaveId] = currentEnclave;
        }
    }

    // Step 5: Process expiring disaster markers
    for (const marker of currentMarkers) {
        marker.duration -= 1;
        if (marker.duration <= 0) {
            const profile = DISASTER_PROFILES[marker.profileKey];
            if (!profile) continue;
            
            const impactProfile = profile.logic.impact;
            const metadata = { ...marker.metadata, originalMarkerId: marker.id };
            
            for (const enclaveId of marker.targetEnclaveIds) {
                let currentEnclave = newEnclaveStates[enclaveId];
                if (!currentEnclave) continue;
                
                const instantResult = applyInstantaneousRules(impactProfile.rules, currentEnclave, newRoutes, impactProfile.duration);
                currentEnclave = instantResult.enclave;
                newRoutes = instantResult.routes;

                if (!remainingEffectsByEnclave[currentEnclave.id]) remainingEffectsByEnclave[currentEnclave.id] = [];
                remainingEffectsByEnclave[currentEnclave.id].push({
                    id: `eff-${marker.profileKey}-${currentEnclave.id}-${Date.now()}`,
                    profileKey: marker.profileKey, icon: profile.ui.icon,
                    duration: impactProfile.duration, maxDuration: impactProfile.duration, phase: 'impact',
                    rules: impactProfile.rules, metadata,
                });

                if (impactProfile.vfx) {
                    if (!currentEnclave.vfxToPlayThisTurn) currentEnclave.vfxToPlayThisTurn = [];
                    currentEnclave.vfxToPlayThisTurn.push(`${marker.profileKey}-impact`);
                }
                if (impactProfile.sfx) {
                    if (!currentEnclave.sfxToPlayThisTurn) currentEnclave.sfxToPlayThisTurn = [];
                    currentEnclave.sfxToPlayThisTurn.push(impactProfile.sfx);
                }
                newEnclaveStates[currentEnclave.id] = currentEnclave;
            }
        } else {
            remainingDisasterMarkers.push(marker);
        }
    }

    // Step 6: Finalize active effects for all enclaves
    for (const enclaveIdStr of Object.keys(newEnclaveStates)) {
        const enclaveId = Number(enclaveIdStr);
        newEnclaveStates[enclaveId].activeEffects = remainingEffectsByEnclave[enclaveId] || [];
    }

    return {
        newEnclaveStates,
        newRoutes,
        remainingDisasterMarkers,
    };
};