

import { GameState, Enclave } from '../../types/game';
import { Action } from './index';
import { DISASTER_PROFILES } from '../../data/disasters';

export const handleTurnLogic = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'START_FIRST_TURN':
            // This action officially starts the game after the "Turn 0" prep phase.
            return {
                ...state,
                currentTurn: 1,
                isPaused: false,
            };

        case 'START_RESOLVING_TURN':
            return {
                ...state,
                isResolvingTurn: true,
            };

        case 'APPLY_RESOLVED_TURN': {
            const { newEnclaveData, newPendingOrders, newRoutes, newCurrentTurn, newDisasterMarkers, gameOverState } = action.payload;
            
            // Re-hydrate the 'rules' for active effects on the main thread.
            Object.values(newEnclaveData).forEach((enclave: Enclave) => {
                if (enclave.activeEffects) {
                    enclave.activeEffects.forEach(effect => {
                        const profile = DISASTER_PROFILES[effect.profileKey];
                        if (profile) {
                            const phaseProfile = profile.logic[effect.phase];
                            if (phaseProfile) {
                                // FIX: Ensure rules is always an object to prevent downstream errors.
                                effect.rules = phaseProfile.rules || {};
                            }
                        }
                    });
                }
            });

            // Reconstruct mapData from the authoritative new enclave data.
            // This is a critical step to prevent state desynchronization.
            let mapDataChanged = false;
            const newMapData = state.mapData.map(cell => {
                if (cell.enclaveId === null) return cell;

                const newEnclaveState = newEnclaveData[cell.enclaveId];

                if (newEnclaveState) {
                    // The enclave exists. Update the cell's owner if it has changed.
                    if (cell.owner !== newEnclaveState.owner) {
                        mapDataChanged = true;
                        return { ...cell, owner: newEnclaveState.owner };
                    }
                } else {
                    // The enclave ID points to nothing, meaning the enclave was destroyed/removed.
                    // Neutralize the cell completely to prevent state inconsistencies.
                    if (cell.owner !== null || cell.enclaveId !== null) {
                         mapDataChanged = true;
                         return { ...cell, owner: null, enclaveId: null };
                    }
                }
                
                return cell;
            });
            
            return {
                ...state,
                enclaveData: newEnclaveData,
                mapData: mapDataChanged ? newMapData : state.mapData,
                pendingOrders: newPendingOrders,
                routes: newRoutes,
                currentTurn: newCurrentTurn,
                activeDisasterMarkers: newDisasterMarkers,
                gamePhase: gameOverState !== 'none' ? 'gameOver' : state.gamePhase,
                gameOverState: gameOverState,
                isPaused: gameOverState !== 'none' ? true : state.isPaused,
                isResolvingTurn: false,
            };
        }
            
        default:
            return state;
    }
};