

import { Enclave, Route, EffectRules } from '../types/game.ts';

/**
 * Calculates the combined production and combat modifiers for an enclave from all active effects.
 * This is the single source of truth for how disaster aftermaths affect an enclave's performance.
 * @param enclave - The enclave to check.
 * @returns An object with the final production and combat modifiers.
 */
export const getAppliedModifiers = (enclave: Enclave): { productionModifier: number; combatModifier: number } => {
    let productionModifier = 1.0;
    let combatModifier = 1.0;

    if (enclave.activeEffects) {
        enclave.activeEffects.forEach(effect => {
            if (effect.rules && 'type' in effect.rules && effect.rules.type === 'forceDisruption') {
                // FIX: Add robust validation to ensure that the reduction values are valid numbers
                // before using them. An undefined value could result in NaN, which would poison
                // the entire game state and cause a crash.
                if (typeof effect.rules.productionReduction === 'number' && isFinite(effect.rules.productionReduction)) {
                    productionModifier -= effect.rules.productionReduction;
                }
                if (typeof effect.rules.combatReduction === 'number' && isFinite(effect.rules.combatReduction)) {
                    combatModifier -= effect.rules.combatReduction;
                }
            }
        });
    }

    // Modifiers cannot go below 0
    return {
        productionModifier: Math.max(0, productionModifier),
        combatModifier: Math.max(0, combatModifier),
    };
};

/**
 * Applies instantaneous effects, like the initial blast of a disaster impact.
 * This is for one-time applications when an effect is first applied or transitions phase.
 * @param rules - The effect rules to apply.
 * @param enclave - The target enclave.
 * @param routes - All game routes, for potential modification.
 * @param duration - The duration of the effect that is being applied, for rules that depend on it.
 * @returns An object with the modified enclave and routes.
 */
export function applyInstantaneousRules(
    rules: EffectRules,
    enclave: Enclave,
    routes: Route[],
    duration?: number
): { enclave: Enclave; routes: Route[] } {
    const newEnclave = { ...enclave };
    let newRoutes = [...routes];

    if (!rules || !('type' in rules)) {
        return { enclave: newEnclave, routes: newRoutes };
    }

    if (rules.type === 'forceDamage') {
        // Sanitize incoming force count to prevent NaN state corruption and create a mutable variable.
        let forcesAfterPercentage = Number.isFinite(newEnclave.forces) ? newEnclave.forces : 0;

        if (typeof rules.percentage === 'number') {
            forcesAfterPercentage *= (1 - rules.percentage);
        }

        let forcesAfterAmount = forcesAfterPercentage;
        // FIX: Check for undefined instead of truthiness to allow for a damage amount of 0.
        if (rules.amount !== undefined) {
            const amount = typeof rules.amount === 'function' ? rules.amount() : rules.amount;
            forcesAfterAmount -= amount;
        }
        
        newEnclave.forces = Math.max(0, Math.floor(forcesAfterAmount));

        if (typeof rules.routeDestructionChance === 'number') {
            newRoutes
                .filter(r => r.from === newEnclave.id || r.to === newEnclave.id)
                .forEach(r => {
                    if (Math.random() < rules.routeDestructionChance!) r.isDestroyed = true;
                });
        }
        if (typeof rules.routeDisruptionChance === 'number' && typeof rules.routeDisruptionDuration === 'number') {
            newRoutes
                .filter(r => (r.from === newEnclave.id || r.to === newEnclave.id) && !r.isDestroyed)
                .forEach(r => {
                    if (Math.random() < rules.routeDisruptionChance!) {
                         // FIX: Add 1 to account for the end-of-turn tick-down, ensuring the effect
                         // lasts for the intended number of full turns.
                         r.disabledForTurns = rules.routeDisruptionDuration! + 1;
                    }
                });
        }
    } else if (rules.type === 'routeDisruption') {
        // This instantaneous effect sets a disable duration on all connected routes.
        // It should match the duration of the ActiveEffect that triggered it.
        newRoutes
            .filter(r => (r.from === newEnclave.id || r.to === newEnclave.id) && !r.isDestroyed)
            .forEach(r => {
                // We add 1 to the duration to account for the end-of-turn tick-down.
                // This ensures an effect lasting 'N' turns disables the route for N full turns.
                const disableDuration = duration ? duration + 1 : 2; // Default to 1 full turn if no duration provided.
                r.disabledForTurns = disableDuration;
            });
    }

    return { enclave: newEnclave, routes: newRoutes };
}

/**
 * Applies effects that happen every turn while an effect is active (e.g., damage over time).
 * @param rules - The effect rules to apply.
 * @param enclave - The target enclave.
 * @param routes - All game routes, for potential modification.
 * @returns An object with the modified enclave and routes.
 */
export function applyContinuousRules(
    rules: EffectRules,
    enclave: Enclave,
    routes: Route[]
): { enclave: Enclave; routes: Route[] } {
    const newEnclave = { ...enclave };
    let newRoutes = [...routes];

    if (!rules || !('type' in rules)) {
        return { enclave: newEnclave, routes: newRoutes };
    }

    if (rules.type === 'forceDamage') {
        // Sanitize incoming force count to prevent NaN state corruption.
        let currentForces = Number.isFinite(newEnclave.forces) ? newEnclave.forces : 0;
        
        // Per user request: Don't do damage if forces are already 0.
        if (currentForces > 0) {
            if (rules.amount !== undefined) {
                const amount = typeof rules.amount === 'function' ? rules.amount() : rules.amount;
                currentForces -= amount;
            }
            if (typeof rules.percentage === 'number') {
                 currentForces *= (1 - rules.percentage);
            }
        }
        
        // Ensure forces don't go below 0.
        newEnclave.forces = Math.max(0, Math.floor(currentForces));
    }
    
    // Handle continuous randomRouteDisruption for Ion Tempest
    if (rules.type === 'forceDisruption' && rules.randomRouteDisruption) {
        const connectedRoutes = newRoutes.filter(
            r => (r.from === newEnclave.id || r.to === newEnclave.id) && !r.isDestroyed && r.disabledForTurns <= 0
        );
        if (connectedRoutes.length > 0) {
            const routeToDisable = connectedRoutes[Math.floor(Math.random() * connectedRoutes.length)];
            // Disable for 2 turns to ensure it lasts one full turn after the end-of-turn tickdown
            routeToDisable.disabledForTurns = 2; 
        }
    }

    return { enclave: newEnclave, routes: newRoutes };
}