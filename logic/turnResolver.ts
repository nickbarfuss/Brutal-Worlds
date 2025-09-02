

import { Enclave, Route, PendingOrders, MapCell, Player, ActiveDisasterMarker, GameOverState } from '../types/game.ts';
import { GAME_CONFIG } from '../data/config.ts';
import { processDisasterEffects } from './disasterManager.ts';
import { resolveAssists } from './assistResolver.ts';
import { resolveAttacks } from './attackResolver.ts';
import { resolveHolding } from './holdResolver.ts';
import { getAssistMultiplierForEnclave } from './birthrightManager.ts';


type GameConfig = typeof GAME_CONFIG;

const safeCloneEnclavesForTurn = (enclaves: { [id: number]: Enclave }): { [id: number]: Enclave } => {
    const newEnclaves: { [id: number]: Enclave } = {};
    for (const id in enclaves) {
        if (Object.prototype.hasOwnProperty.call(enclaves, id)) {
            const oldEnclave = enclaves[id];
            newEnclaves[id] = {
                ...oldEnclave,
                center: oldEnclave.center.clone(),
                activeEffects: (oldEnclave.activeEffects || []).map(effect => ({ ...effect })),
                vfxToPlayThisTurn: [...(oldEnclave.vfxToPlayThisTurn || [])],
                sfxToPlayThisTurn: [...(oldEnclave.sfxToPlayThisTurn || [])],
            };
        }
    }
    return newEnclaves;
};

export const resolveTurn = (
    currentEnclaves: { [id: number]: Enclave },
    currentOrders: PendingOrders,
    currentRoutes: Route[],
    currentTurn: number,
    currentDisasterMarkers: ActiveDisasterMarker[],
    gameConfig: GameConfig
) => {
    // --- 1. Create a mutable copy of the game state for this turn's resolution ---
    let newEnclaveStates = safeCloneEnclavesForTurn(currentEnclaves);
    let newRoutes = currentRoutes.map(r => ({ ...r }));
    
    let processedOrders: PendingOrders = {};
    for (const fromId in currentOrders) {
        if (Object.prototype.hasOwnProperty.call(currentOrders, fromId)) {
            processedOrders[fromId] = { ...currentOrders[fromId] };
        }
    }

    // --- 2. Resolve Disasters ---
    let remainingDisasterMarkers = currentDisasterMarkers;
    
    // PER USER REQUEST: Disasters are disabled for this testing phase.
    /*
    const disasterResult = processDisasterEffects(newEnclaveStates, newRoutes, currentDisasterMarkers);
    newEnclaveStates = disasterResult.newEnclaveStates;
    newRoutes = disasterResult.newRoutes;
    remainingDisasterMarkers = disasterResult.remainingDisasterMarkers;
    */
    
    // --- 3. Prune invalid orders ---
    // This is run after disasters to catch orders that became invalid due to disaster effects (e.g., destroyed routes, neutralized enclaves).
    Object.keys(processedOrders).forEach(fromIdStr => {
        const fromId = parseInt(fromIdStr, 10);
        const order = processedOrders[fromId];
        const fromEnclave = newEnclaveStates[fromId];
        const toEnclave = newEnclaveStates[order.to];

        // Prune orders from enclaves that were neutralized or no longer exist.
        if (!fromEnclave || !fromEnclave.owner) {
            delete processedOrders[fromId];
            return;
        }

        if (!toEnclave) {
            delete processedOrders[fromId];
            return;
        }

        const route = newRoutes.find(r => (r.from === fromId && r.to === order.to) || (r.to === fromId && r.from === order.to));
        if (!route || route.isDestroyed || route.disabledForTurns > 0) {
            delete processedOrders[fromId];
            return;
        }
        
        if (order.type === 'attack' && fromEnclave.owner === toEnclave.owner) {
            delete processedOrders[fromId];
            return;
        }
        if (order.type === 'assist' && fromEnclave.owner !== toEnclave.owner) {
            delete processedOrders[fromId];
            return;
        }

        if (fromEnclave && order.type === 'assist') {
            const assistMultiplier = getAssistMultiplierForEnclave(fromEnclave);
            // FIX: Sanitize the force count before this calculation. This is a critical
            // step to prevent a corrupted (NaN) force count from the disaster phase
            // from allowing an invalid assist order to proceed.
            const safeForces = Number.isFinite(fromEnclave.forces) ? fromEnclave.forces : 0;
            const forceToSend = Math.ceil(safeForces * assistMultiplier);
            if (safeForces - forceToSend <= 0) {
                delete processedOrders[fromId];
            }
        }
    });

    // --- 4. Resolve Assists ---
    newEnclaveStates = resolveAssists(
        newEnclaveStates,
        processedOrders
    );

    // --- 5. Resolve Attacks ---
    const attackResult = resolveAttacks(
        newEnclaveStates,
        processedOrders
    );
    newEnclaveStates = attackResult.newEnclaveData;
    processedOrders = attackResult.newPendingOrders;

    // --- 6. Resolve Holding ---
    newEnclaveStates = resolveHolding(
        newEnclaveStates,
        processedOrders,
        newRoutes
    );
    
    // FIX: Neutralization now occurs *after* all force modifications (assists, attacks, holding)
    // are complete. This ensures the final state is consistent before checking win conditions.
    // --- 7. Neutralize enclaves with zero or negative forces ---
    Object.values(newEnclaveStates).forEach(enclave => {
        // FIX: Sanitize the force count before checking for neutralization. This is a
        // critical step to prevent a corrupted (NaN) force count from bypassing this
        // check (since NaN <= 0 is false), which would poison the game state.
        const safeForces = Number.isFinite(enclave.forces) ? enclave.forces : 0;
        if (safeForces <= 0) {
            enclave.owner = null;
            enclave.archetypeKey = undefined;
            enclave.forces = 0; // Explicitly set to 0 after neutralization
        }
    });

    // --- 8. Tick down disabled routes ---
    newRoutes.forEach(r => {
        if (r.disabledForTurns > 0) r.disabledForTurns--;
    });

    // --- 9. Check for Win/Loss Conditions ---
    const postResolutionEnclaves = Object.values(newEnclaveStates);
    const playerEnclaves = postResolutionEnclaves.filter(e => e.owner === 'player-1');
    const opponentEnclaves = postResolutionEnclaves.filter(e => e.owner === 'player-2');

    let gameOverState: GameOverState = 'none';
    if (playerEnclaves.length === 0) {
        gameOverState = 'defeat';
    } else if (opponentEnclaves.length === 0) {
        gameOverState = 'victory';
    }

    // --- 10. Sanitize final force counts ---
    Object.values(newEnclaveStates).forEach(enclave => {
        if (!Number.isFinite(enclave.forces)) {
            enclave.forces = 0;
        }
        enclave.forces = Math.min(gameConfig.FORCE_SUPPLY_CAP, Math.round(enclave.forces));
    });

    // --- 11. Determine which orders persist to the NEXT turn ---
    const nextTurnOrders: PendingOrders = {};
    Object.keys(processedOrders).forEach(fromIdStr => {
        const fromId = parseInt(fromIdStr, 10);
        const originalOrder = currentOrders[fromId];
        const resolvedOrder = processedOrders[fromId];

        // Only persist orders that were converted from 'attack' to 'assist'.
        // This is the "smart follow-up" command after a successful conquest.
        // All other orders (assists, failed attacks) are consumed this turn.
        if (originalOrder && originalOrder.type === 'attack' && resolvedOrder.type === 'assist') {
            nextTurnOrders[fromId] = resolvedOrder;
        }
    });

    return {
        newEnclaveData: newEnclaveStates,
        newPendingOrders: nextTurnOrders,
        newRoutes,
        newCurrentTurn: currentTurn + 1,
        newDisasterMarkers: remainingDisasterMarkers,
        gameOverState,
    };
};