

import { Enclave, Route } from '../types/game.ts';

/**
 * Calculates the additional combat bonus for an attacking enclave based on its Birthright.
 * @param enclave - The attacking enclave.
 * @returns The numerical combat bonus (e.g., 1 for First Sword).
 */
export const getAttackBonusForEnclave = (enclave: Enclave): number => {
    if (enclave.archetypeKey === 'first-sword') {
        return 1; // Kinetic Onslaught bonus
    }
    return 0;
};

/**
 * Gets the force multiplier for an assist order based on the origin enclave's Birthright.
 * @param enclave - The enclave issuing the assist order.
 * @returns The force multiplier (e.g., 1/3 for Labyrinthine Ghost, 1/4 otherwise).
 */
export const getAssistMultiplierForEnclave = (enclave: Enclave): number => {
    if (enclave.archetypeKey === 'labyrinthine-ghost') {
        return 1 / 3; // Panopticon Web bonus
    }
    return 1 / 4; // Standard assist
};

/**
 * Applies Birthright effects related to the 'Holding' order that do not grant forces.
 * This is primarily for effects on neighboring enclaves, like Memetic Resonance.
 * @param newEnclaveStates - The current state of all enclaves.
 * @param holdingEnclaveIds - A list of IDs for enclaves that are holding this turn.
 * @param routes - The list of all routes.
 * @returns The updated enclave states.
 */
export const applyHoldingBirthrightEffects = (
    newEnclaveStates: { [id: number]: Enclave },
    holdingEnclaveIds: number[],
    routes: Route[]
): { [id: number]: Enclave } => {

    // --- BIRTHRIGHT: Memetic Resonance (Pact Whisperer) ---
    const holdingPactWhispererIds = holdingEnclaveIds.filter(id => {
        const enclave = newEnclaveStates[id];
        return enclave.archetypeKey === 'pact-whisperer';
    });

    if (holdingPactWhispererIds.length > 0) {
        // Use a Set to ensure we only affect each neutral enclave once, even if it's adjacent to multiple Pact Whisperers.
        const neutralsToAffect = new Set<number>();
        
        holdingPactWhispererIds.forEach(enclaveId => {
            routes.forEach(r => {
                if ((r.from === enclaveId || r.to === enclaveId) && !r.isDestroyed) {
                    const neighborId = r.from === enclaveId ? r.to : r.from;
                    const neighbor = newEnclaveStates[neighborId];
                    if (neighbor && neighbor.owner === null) {
                        neutralsToAffect.add(neighborId);
                    }
                }
            });
        });
        
        neutralsToAffect.forEach(neutralId => {
            const neutral = newEnclaveStates[neutralId];
            // FIX: Add a defensive check to ensure the enclave exists before modifying it.
            // This prevents a TypeError if a route points to a non-existent neighbor,
            // which could crash the web worker and cause an 'Uncaught' error.
            if (neutral) {
                // FIX: Sanitize the neutral enclave's force count before calculation.
                const safeForces = Number.isFinite(neutral.forces) ? neutral.forces : 0;
                neutral.forces = Math.max(0, safeForces - 1);
            }
        });
    }

    return newEnclaveStates;
};

/**
 * Gets the bonus reinforcements for a holding enclave based on its Birthright.
 * @param enclave - The holding enclave.
 * @returns The numerical bonus to reinforcements (e.g., 1 for Genesis Forge).
 */
export const getHoldingBonusForEnclave = (enclave: Enclave): number => {
    if (enclave.archetypeKey === 'world-artificer') {
        return 1; // Genesis Forge bonus
    }
    return 0;
};