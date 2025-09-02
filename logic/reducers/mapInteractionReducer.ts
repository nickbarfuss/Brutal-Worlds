

import { GameState, InspectedEntity } from '../../types/game';
import { Action } from './index';
import { handleSingleClick, handleDoubleClick } from '../orderManager';

const setHoveredCell = (state: GameState, payload: number): GameState => {
    const id = payload;
    if (state.hoveredCellId === id) return state;
    
    let newHoveredEntity: { name: string; type: 'enclave' | 'domain' | 'rift' | 'expanse', owner: any } | null = null;
    if (id !== -1 && state.mapData.length > id) {
        const cell = state.mapData[id];
        if (cell.enclaveId !== null && state.enclaveData[cell.enclaveId]) {
            const enclave = state.enclaveData[cell.enclaveId];
            newHoveredEntity = { name: enclave.name, type: 'enclave', owner: enclave.owner };
        } else if (cell.domainId !== null && state.domainData[cell.domainId]) {
            newHoveredEntity = { name: state.domainData[cell.domainId].name, type: 'domain', owner: null };
        } else if (cell.voidId !== null) {
            if (cell.voidType === 'rift' && state.riftData[cell.voidId]) {
                newHoveredEntity = { name: state.riftData[cell.voidId].name, type: 'rift', owner: null };
            } else if (cell.voidType === 'expanse' && state.expanseData[cell.voidId]) {
                newHoveredEntity = { name: state.expanseData[cell.voidId].name, type: 'expanse', owner: null };
            }
        }
    }
    return { ...state, hoveredCellId: id, hoveredEntity: newHoveredEntity };
};

const clickMap = (state: GameState, payload: number | null): GameState => {
    const cellId = payload;
    
    // Clicking off-map deselects
    if (cellId === null || cellId === -1) {
        const sfxToPlay = state.selectedEnclaveId !== null ? 'game-command-mode-exit' : null;
        return { ...state, selectedEnclaveId: null, inspectedEntity: null, isCardVisible: false, sfxToPlay };
    }
    
    const cell = state.mapData[cellId];
    if (!cell) return state;

    if (cell.enclaveId !== null) {
        if (state.currentTurn === 0) {
            // In Turn 0, we can only inspect, not enter command mode or issue orders.
            // This allows for map exploration before the game starts.
            return {
                ...state,
                selectedEnclaveId: null, // Ensure we don't enter command mode
                inspectedEntity: { type: 'enclave', id: cell.enclaveId },
                isCardVisible: true,
                sfxToPlay: state.selectedEnclaveId !== null ? 'game-command-mode-exit' : null,
            };
        }
        
        const result = handleSingleClick(
            cell.enclaveId, state.selectedEnclaveId, state.enclaveData, state.routes, state.pendingOrders
        );
        return {
            ...state,
            pendingOrders: result.updatedOrders,
            selectedEnclaveId: result.newSelectedEnclaveId,
            inspectedEntity: result.newInspectedEnclaveId !== null ? { type: 'enclave', id: result.newInspectedEnclaveId } : null,
            isCardVisible: result.isCardVisible,
            vfxToPlay: result.vfxToPlay,
            sfxToPlay: result.sfxToPlay,
        };
    } else if (cell.voidId !== null && cell.voidType) {
        const sfxToPlay = state.selectedEnclaveId !== null ? 'game-command-mode-exit' : null;
        return {
            ...state,
            selectedEnclaveId: null,
            inspectedEntity: { type: cell.voidType, id: cell.voidId },
            isCardVisible: true,
            sfxToPlay: sfxToPlay,
        };
    }
    
    // Clicking on an empty land cell deselects
    const sfxToPlay = state.selectedEnclaveId !== null ? 'game-command-mode-exit' : null;
    return { ...state, selectedEnclaveId: null, inspectedEntity: null, isCardVisible: false, sfxToPlay };
};

const dblClickMap = (state: GameState, payload: number | null): GameState => {
    // Disable double-click actions during Turn 0 as well.
    if (state.currentTurn === 0) return state;
    const enclaveId = payload;
    const result = handleDoubleClick(enclaveId, state.enclaveData, state.pendingOrders);
    return { ...state, pendingOrders: result.updatedOrders, selectedEnclaveId: null, vfxToPlay: result.vfxToPlay, sfxToPlay: result.sfxToPlay };
};

const focusOnEnclave = (state: GameState, payload: number): GameState => {
    if (payload === -1) {
        return { ...state, cameraFocusAnimation: null };
    }
    const targetEnclave = state.enclaveData[payload];
    if (!targetEnclave) return state;
    return { ...state, cameraFocusAnimation: { active: true, target: targetEnclave.center.clone() } };
};

const setInspected = (state: GameState, payload: InspectedEntity | null): GameState => {
    return { ...state, inspectedEntity: payload, isCardVisible: !!payload };
};

export const handleMapInteraction = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'SET_HOVERED_CELL': return setHoveredCell(state, action.payload);
        case 'HANDLE_MAP_CLICK': return clickMap(state, action.payload);
        case 'HANDLE_DBL_CLICK': return dblClickMap(state, action.payload);
        case 'FOCUS_ON_ENCLAVE': return focusOnEnclave(state, action.payload);
        case 'SET_INSPECTED_ENTITY': return setInspected(state, action.payload);
        default: return state;
    }
};