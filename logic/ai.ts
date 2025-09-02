

import { Enclave, Route, PendingOrders } from '../types/game.ts';
import { getAssistMultiplierForEnclave, getAttackBonusForEnclave } from './birthrightManager.ts';
import { getAppliedModifiers } from './effectProcessor.ts';

/**
 * Helper function to find the weakest enclave from a list of candidates in a
 * stable, deterministic way.
 * @param candidates - An array of enclaves to search through.
 * @returns The enclave with the lowest force count. Ties are broken by the lowest ID. Returns null if the list is empty.
 */
const findWeakestEnclave = (candidates: Enclave[]): Enclave | null => {
    if (candidates.length === 0) {
        return null;
    }
    // Create a shallow copy before sorting to avoid side effects on the original list.
    const sortedCandidates = [...candidates].sort((a, b) => {
        // CRITICAL FIX: Sanitize forces before comparison to prevent NaN from breaking
        // the sort function, which would crash the worker and cause an "Uncaught" error.
        const forcesA = Number.isFinite(a.forces) ? a.forces : 0;
        const forcesB = Number.isFinite(b.forces) ? b.forces : 0;
        
        // Primary sort: lowest forces.
        if (forcesA !== forcesB) {
            return forcesA - forcesB;
        }
        // Secondary sort (tie-breaker): lowest ID. This ensures a stable, deterministic result.
        return a.id - b.id;
    });
    return sortedCandidates[0];
};


/**
 * Calculates the AI opponent's orders for the turn.
 * The AI prioritizes saving weak allies, then attacking weak targets, and holds otherwise.
 * @param enclaveData - The current state of all enclaves.
 * @param routes - The list of all routes.
 * @param existingOrders - Orders that have already been determined (e.g., smart follow-ups).
 * @returns A PendingOrders object containing only the AI's new orders.
 */
export const calculateAIOrders = (
  enclaveData: { [id: number]: Enclave },
  routes: Route[],
  existingOrders: PendingOrders
): PendingOrders => {
  const aiOrders: PendingOrders = {};
  const opponentEnclaves = Object.values(enclaveData).filter(e => e.owner === 'player-2');

  // PERF: Create an adjacency list from routes for efficient neighbor lookup.
  // This avoids iterating all routes for every single AI enclave (O(E*R) -> O(E+R)).
  const adjacencyList = new Map<number, number[]>();
  routes.forEach(route => {
    if (route.isDestroyed || route.disabledForTurns > 0) return;
    if (!adjacencyList.has(route.from)) adjacencyList.set(route.from, []);
    if (!adjacencyList.has(route.to)) adjacencyList.set(route.to, []);
    adjacencyList.get(route.from)!.push(route.to);
    adjacencyList.get(route.to)!.push(route.from);
  });

  opponentEnclaves.forEach(origin => {
    // If a smart follow-up order (attack -> assist) has been generated
    // for this enclave, respect it and do not generate a new order.
    if (existingOrders[origin.id]) {
        return; // Skip to the next AI enclave
    }
    
    // FIX: Defensively sanitize the origin's force count. This is a critical
    // firewall to prevent a corrupted NaN value from a previous step (like
    // a disaster) from poisoning all subsequent AI calculations and crashing
    // the web worker.
    const safeOriginForces = Number.isFinite(origin.forces) ? origin.forces : 0;
    if (safeOriginForces <= 0) {
        return; // Can't issue orders with no forces.
    }
      
    const potentialAttackTargets: Enclave[] = [];
    const potentialAssistTargets: Enclave[] = [];
    
    const neighbors = adjacencyList.get(origin.id) || [];
    for (const adjacentId of neighbors) {
        const adjacentEnclave = enclaveData[adjacentId];
        if (adjacentEnclave) {
          // NOTE: Sanitization of neighbor forces now happens robustly inside findWeakestEnclave.
          // This ensures all comparisons are safe from NaN values.
          if (adjacentEnclave.owner !== 'player-2') {
            potentialAttackTargets.push(adjacentEnclave);
          } else if (adjacentEnclave.id !== origin.id) { // Prevent self-assist
            potentialAssistTargets.push(adjacentEnclave);
          }
        }
    }

    // --- AI Decision Logic ---

    // Find the weakest targets of each type using the new stable-sort helper.
    const weakestAttackTarget = findWeakestEnclave(potentialAttackTargets);
    const weakestAlly = findWeakestEnclave(potentialAssistTargets);

    // ARCHITECTURAL REFACTOR: Prioritize opportunistic attacks over defensive assists.
    // This proactive strategy leads to more stable and predictable game states by simplifying
    // the board, which prevents the AI from getting into the complex, under-tested scenarios
    // that were causing "Uncaught" errors.

    // 1. Look for a good attack opportunity.
    // STABILITY FIX: Change condition to > 2. This makes the AI more strategically balanced.
    // It prevents overly aggressive moves with very few forces, but allows it to capitalize
    // on clear opportunities, avoiding the unstable states caused by extreme passivity.
    if (weakestAttackTarget && safeOriginForces > 2) {
        const { combatModifier } = getAppliedModifiers(origin);
        const forceToSend = Math.ceil(safeOriginForces / 3);
        const effectiveForce = Math.floor(forceToSend * combatModifier);
        const totalDamage = effectiveForce + 1 + getAttackBonusForEnclave(origin);

        const safeTargetForces = Number.isFinite(weakestAttackTarget.forces) ? weakestAttackTarget.forces : Infinity;

        if (totalDamage >= safeTargetForces) {
            aiOrders[origin.id] = { to: weakestAttackTarget.id, type: 'attack' };
            return; // Move to the next AI enclave
        }
    }

    // 2. If no good attack is available, assist a very weak ally.
    const DANGER_THRESHOLD = 5;
    const MIN_ASSIST_FORCE = 5;
    
    const safeAllyForces = weakestAlly && Number.isFinite(weakestAlly.forces) ? weakestAlly.forces : Infinity;
    
    if (weakestAlly && safeAllyForces < DANGER_THRESHOLD && safeOriginForces >= MIN_ASSIST_FORCE) {
      const assistMultiplier = getAssistMultiplierForEnclave(origin);
      const forceToSend = Math.ceil(safeOriginForces * assistMultiplier);
      // STABILITY FIX: Make AI more conservative. Only assist if it can leave a
      // meaningful force of more than 2 units behind. This prevents the AI from
      // over-extending and creating fragile, unstable game states that could lead to a crash.
      if (safeOriginForces - forceToSend > 2) {
        aiOrders[origin.id] = { to: weakestAlly.id, type: 'assist' };
        return; // Move to the next AI enclave
      }
    }
    
    // 3. If no other action is taken, the enclave will implicitly "hold"
  });

  return aiOrders;
};