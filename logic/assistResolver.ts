

import { Enclave, PendingOrders, Order } from '../types/game.ts';
import { GAME_CONFIG } from '../data/config.ts';
import { getAssistMultiplierForEnclave } from './birthrightManager.ts';

export const resolveAssists = (
    currentEnclaves: { [id: number]: Enclave },
    processedOrders: PendingOrders
): { [id: number]: Enclave } => {
    const newEnclaveStates = currentEnclaves;
    const { FORCE_SUPPLY_CAP } = GAME_CONFIG;

    const forceTransfers: { from: number; to: number; amount: number }[] = [];

    // Step 1: Calculate all transfers based on the state at the start of the phase.
    // This prevents the outcome from depending on the iteration order.
    Object.entries(processedOrders).forEach(([fromIdStr, orderUntyped]) => {
        // FIX: Add a defensive check to ensure the order object is not null. A null
        // value could be introduced through data corruption, and accessing its properties
        // would cause a fatal TypeError, crashing the worker.
        if (!orderUntyped) return;

        const order = orderUntyped as Order;
        if (order.type !== 'assist') return;

        const fromId = parseInt(fromIdStr, 10);
        const origin = newEnclaveStates[fromId];
        const destination = newEnclaveStates[order.to];

        if (!origin || !destination) return;

        const assistMultiplier = getAssistMultiplierForEnclave(origin);
        
        // FIX: Sanitize the origin's force count before calculation to prevent NaN propagation.
        const safeForces = Number.isFinite(origin.forces) ? origin.forces : 0;
        const forceToSend = Math.ceil(safeForces * assistMultiplier);

        if (forceToSend > 0 && safeForces >= forceToSend) {
            forceTransfers.push({ from: fromId, to: order.to, amount: forceToSend });
        }
    });

    // Step 2: Apply all calculated transfers simultaneously.
    forceTransfers.forEach(({ from, to, amount }) => {
        if (newEnclaveStates[from] && newEnclaveStates[to]) {
            newEnclaveStates[from].forces -= amount;
            newEnclaveStates[to].forces += amount;
        }
    });
    
    // Step 3: Enforce supply cap on all affected enclaves at the end.
    const affectedEnclaveIds = new Set(forceTransfers.flatMap(t => [t.from, t.to]));
    affectedEnclaveIds.forEach(id => {
        if (newEnclaveStates[id]) {
            newEnclaveStates[id].forces = Math.min(FORCE_SUPPLY_CAP, newEnclaveStates[id].forces);
        }
    });

    return newEnclaveStates;
};