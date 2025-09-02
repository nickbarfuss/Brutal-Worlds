

import { Enclave, PendingOrders, Route } from '../types/game.ts';
import { GAME_CONFIG } from '../data/config.ts';
import { getAppliedModifiers } from './effectProcessor.ts';
import { applyHoldingBirthrightEffects, getHoldingBonusForEnclave } from './birthrightManager.ts';

export const resolveHolding = (
    currentEnclaves: { [id: number]: Enclave },
    processedOrders: PendingOrders,
    currentRoutes: Route[]
): { [id: number]: Enclave } => {
    let newEnclaveStates = currentEnclaves;
    const { FORCE_SUPPLY_CAP } = GAME_CONFIG;

    const holdingEnclaveIds: number[] = [];

    // 1. Determine which enclaves are holding and apply reinforcements.
    Object.values(newEnclaveStates).forEach((enclave: Enclave) => {
        if ((enclave.owner === 'player-1' || enclave.owner === 'player-2') && !processedOrders[enclave.id]) {
            holdingEnclaveIds.push(enclave.id);
            
            let reinforcements = 2; // Standard holding value
            
            // Add birthright bonus *before* applying modifiers
            reinforcements += getHoldingBonusForEnclave(enclave);

            const { productionModifier } = getAppliedModifiers(enclave);
            reinforcements *= productionModifier;
            
            // FIX: Sanitize the enclave's force count before adding reinforcements to prevent NaN state corruption.
            const safeForces = Number.isFinite(enclave.forces) ? enclave.forces : 0;
            enclave.forces = Math.min(FORCE_SUPPLY_CAP, safeForces + Math.floor(reinforcements));
        }
    });
    
    // 2. Apply other holding-related Birthright effects (like Memetic Resonance).
    newEnclaveStates = applyHoldingBirthrightEffects(
        newEnclaveStates,
        holdingEnclaveIds,
        currentRoutes
    );

    return newEnclaveStates;
};