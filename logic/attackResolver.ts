

import { Enclave, PendingOrders, Player, Order } from '../types/game.ts';
import { GAME_CONFIG } from '../data/config.ts';
import { getAppliedModifiers } from './effectProcessor.ts';
import { getAttackBonusForEnclave } from './birthrightManager.ts';

interface Attack {
    from: number;
    owner: Player;
    force: number;
    bonus: number;
    archetypeKey?: string;
}

export const resolveAttacks = (
    currentEnclaves: { [id: number]: Enclave },
    processedOrders: PendingOrders
): { newEnclaveData: { [id: number]: Enclave }, newPendingOrders: PendingOrders } => {
    const newEnclaveStates = currentEnclaves;
    const newPendingOrders = processedOrders;
    const { FORCE_SUPPLY_CAP } = GAME_CONFIG;

    const attackOrders = new Map<number, Attack[]>();
    const forcesLeaving: { [fromId: number]: number } = {};

    // 1. Calculate forces leaving for all attacks and group them by target.
    // Bonuses must be calculated here, before any enclaves are modified by other battles.
    Object.entries(newPendingOrders).forEach(([fromIdStr, orderUntyped]) => {
        // FIX: Add a defensive check to ensure the order object is not null. A null
        // value could be introduced through data corruption, and accessing its properties
        // would cause a fatal TypeError, crashing the worker.
        if (!orderUntyped) return;

        const order = orderUntyped as Order;
        if (order.type !== 'attack') return;

        const fromId = parseInt(fromIdStr, 10);
        const origin = newEnclaveStates[fromId];
        if (!origin || !origin.owner) return;

        // FIX: Defensively sanitize the origin's force count before calculation.
        // This prevents a NaN from propagating if the enclave's state was corrupted
        // in a prior, unsanitized step.
        const safeForces = Number.isFinite(origin.forces) ? origin.forces : 0;
        const attackMultiplier = 1 / 3;
        const unitsLeaving = Math.ceil(safeForces * attackMultiplier);

        if (unitsLeaving > 0 && safeForces >= unitsLeaving) {
            forcesLeaving[fromId] = unitsLeaving;

            const { combatModifier } = getAppliedModifiers(origin);
            const effectiveForce = Math.floor(unitsLeaving * combatModifier);
            
            // Calculate bonus based on the state *before* any battles resolve.
            const bonus = 1 + getAttackBonusForEnclave(origin);
            
            if (!attackOrders.has(order.to)) attackOrders.set(order.to, []);
            attackOrders.get(order.to)!.push({ 
                from: fromId, 
                owner: origin.owner as Player, 
                force: effectiveForce,
                bonus: bonus, // Store the calculated bonus
                archetypeKey: origin.archetypeKey,
            });
        }
    });

    // 2. Subtract leaving forces from origin enclaves
    for (const fromIdStr in forcesLeaving) {
        const fromId = parseInt(fromIdStr, 10);
        newEnclaveStates[fromId].forces -= forcesLeaving[fromId];
    }
    
    // 3. Resolve battles for each target.
    attackOrders.forEach((attackers, targetId) => {
        const target = newEnclaveStates[targetId];
        if (!target) return;

        // FIX: Add a defensive check. In rare cases where all attacks against a target
        // are pruned (e.g., by disaster effects), the attackers list could be empty.
        // This prevents a TypeError when trying to find a 'winning attacker' from an empty array.
        if (attackers.length === 0) {
            return;
        }
        
        const originalOwner = target.owner;
        // FIX: Sanitize the target's force count as well to ensure the combat
        // calculation is always performed with valid numbers.
        const safeTargetForces = Number.isFinite(target.forces) ? target.forces : 0;
        let totalAttackForce = 0;
        attackers.forEach(attacker => {
            // Use the pre-calculated bonus from the Attack object, not the live state.
            totalAttackForce += attacker.force + attacker.bonus;
        });

        target.forces = safeTargetForces - totalAttackForce;

        // FIX: Change condition to `<= 0` so that attackers win ties.
        if (target.forces <= 0) { // Conquest
            // STABILITY FIX: Make winner selection deterministic. Sort by the highest
            // attack force, then by the lowest enclave ID as a tie-breaker. This
            // prevents unpredictable outcomes from the same game state, which could
            // lead to hard-to-trace crashes in a complex simulation.
            const winningAttacker = [...attackers].sort((a, b) => {
                if (a.force !== b.force) {
                    return b.force - a.force; // Higher force wins
                }
                return a.from - b.from; // Lower ID wins ties
            })[0];

            const newOwner = winningAttacker.owner;
            target.owner = newOwner;
            target.archetypeKey = winningAttacker.archetypeKey;
            
            // FIX: Ensure a conquered territory has at least 1 force to prevent immediate neutralization.
            const remainingForces = Math.abs(target.forces);
            target.forces = Math.min(FORCE_SUPPLY_CAP, Math.max(1, remainingForces));
            
            if (originalOwner !== target.owner) {
                const vfxKey = target.owner === 'player-1' ? 'conquest-player' : 'conquest-opponent';
                if (!target.vfxToPlayThisTurn) target.vfxToPlayThisTurn = [];
                target.vfxToPlayThisTurn.push(vfxKey);

                const sfxKey = target.owner === 'player-1' ? 'conquest-player-1' : 'conquest-player-2';
                if (!target.sfxToPlayThisTurn) target.sfxToPlayThisTurn = [];
                target.sfxToPlayThisTurn.push(sfxKey);

                attackers.forEach(attacker => {
                    if (attacker.owner === newOwner) {
                        const order = newPendingOrders[attacker.from];
                        if (order && order.to === targetId && order.type === 'attack') {
                            order.type = 'assist';
                        }
                    }
                });
            }
        }
    });

    return { newEnclaveData: newEnclaveStates, newPendingOrders };
};