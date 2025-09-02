
import { GameState } from '../../types/game';
import { Action } from './index';
import { triggerNewDisaster as triggerDisasterLogic } from '../disasterManager';

export const handleDisasters = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'TRIGGER_DISASTER': {
            const result = triggerDisasterLogic(action.payload, {
                enclaveData: state.enclaveData, domainData: state.domainData, mapData: state.mapData, expanseData: state.expanseData,
            });
            if (!result) return state;

            const newActiveDisasterMarkers = result.newMarker ? [...state.activeDisasterMarkers, result.newMarker] : state.activeDisasterMarkers;
            let newEnclaveData = state.enclaveData;
            if (result.updatedEnclaves) {
                newEnclaveData = result.updatedEnclaves;
            }
            return { ...state, activeDisasterMarkers: newActiveDisasterMarkers, enclaveData: newEnclaveData, latestDisaster: result.snackbarData };
        }

        case 'CLEAR_LATEST_DISASTER':
            return { ...state, latestDisaster: null };

        default:
            return state;
    }
};
