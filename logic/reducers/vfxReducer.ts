import { GameState, Enclave } from '../../types/game';
import { Action } from './index';

const safeCloneEnclaves = (enclaves: { [id: number]: Enclave }): { [id: number]: Enclave } => {
    const newEnclaves: { [id: number]: Enclave } = {};
    for (const id in enclaves) {
        if (Object.prototype.hasOwnProperty.call(enclaves, id)) {
            newEnclaves[id] = { ...enclaves[id] };
        }
    }
    return newEnclaves;
};

export const handleFx = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'UPDATE_VFX_SFX': {
            const enclavesToUpdate: { [id: number]: Partial<Enclave> } = {};
            Object.values(state.enclaveData).forEach(enclave => {
                if (enclave.vfxToPlayThisTurn && enclave.vfxToPlayThisTurn.length > 0) {
                    enclavesToUpdate[enclave.id] = { ...enclavesToUpdate[enclave.id], vfxToPlayThisTurn: [] };
                }
                if (enclave.sfxToPlayThisTurn && enclave.sfxToPlayThisTurn.length > 0) {
                    enclavesToUpdate[enclave.id] = { ...enclavesToUpdate[enclave.id], sfxToPlayThisTurn: [] };
                }
            });
            if (Object.keys(enclavesToUpdate).length === 0) return state;

            const newEnclaveData = safeCloneEnclaves(state.enclaveData);
            for (const id in enclavesToUpdate) {
                newEnclaveData[id] = { ...newEnclaveData[id], ...enclavesToUpdate[id] };
            }
            return { ...state, enclaveData: newEnclaveData };
        }

        case 'CLEAR_VFX':
            return { ...state, vfxToPlay: null };

        case 'CLEAR_SFX':
            return { ...state, sfxToPlay: null };
            
        default:
            return state;
    }
};
