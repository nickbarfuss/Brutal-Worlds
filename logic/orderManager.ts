

import { Enclave, PendingOrders, Route, OrderType } from '../types/game.ts';
import { getAssistMultiplierForEnclave } from './birthrightManager.ts';

export const handleSingleClick = (
    clickedEnclaveId: number | null,
    selectedEnclaveId: number | null,
    enclaveData: { [id: number]: Enclave },
    routes: Route[],
    pendingOrders: PendingOrders
) => {
    if (clickedEnclaveId === null) {
        return {
            newSelectedEnclaveId: null,
            newInspectedEnclaveId: null,
            isCardVisible: false,
            updatedOrders: pendingOrders,
            vfxToPlay: null,
            sfxToPlay: selectedEnclaveId !== null ? 'game-command-mode-exit' : null,
        };
    }

    const clickedEnclave = enclaveData[clickedEnclaveId];
    if (!clickedEnclave) {
        return {
            newSelectedEnclaveId: null,
            newInspectedEnclaveId: null,
            isCardVisible: false,
            updatedOrders: pendingOrders,
            vfxToPlay: null,
            sfxToPlay: null,
        };
    }

    if (selectedEnclaveId !== null) {
        const originEnclave = enclaveData[selectedEnclaveId];
        if (!originEnclave) {
            // Defensive check for inconsistent state. If the selected enclave doesn't exist,
            // it's safest to cancel command mode and inspect what was actually clicked.
            // This can prevent an "Uncaught" TypeError if state becomes corrupted.
            return {
                newSelectedEnclaveId: null,
                newInspectedEnclaveId: clickedEnclaveId,
                isCardVisible: true,
                updatedOrders: pendingOrders,
                vfxToPlay: null,
                sfxToPlay: 'game-command-mode-exit',
            };
        }
        const route = routes.find(r => 
            ((r.from === selectedEnclaveId && r.to === clickedEnclaveId) || (r.to === selectedEnclaveId && r.from === clickedEnclaveId)) && 
            !r.isDestroyed && 
            r.disabledForTurns <= 0
        );

        if (route && clickedEnclave.id !== selectedEnclaveId) {
            const orderType: OrderType = clickedEnclave.owner === originEnclave.owner ? 'assist' : 'attack';
            
            // Prevent suicidal assist orders
            if (orderType === 'assist') {
                // FIX: Sanitize the origin enclave's force count before calculation. This is a critical
                // fix to prevent a NaN value from allowing an invalid "suicidal" assist order to be
                // created, which would corrupt the game state and cause a crash.
                const safeForces = Number.isFinite(originEnclave.forces) ? originEnclave.forces : 0;
                const assistMultiplier = getAssistMultiplierForEnclave(originEnclave);
                const forceToSend = Math.ceil(safeForces * assistMultiplier);
                if (safeForces - forceToSend <= 0) {
                    // This is an invalid order, fall through to the "invalid click" behavior
                } else {
                    const vfxKey = `order-${orderType}`;
                    const sfxKey = `game-order-issue-${orderType}`;
                    const updatedOrders = { ...pendingOrders, [selectedEnclaveId]: { to: clickedEnclaveId, type: orderType }};
        
                    return {
                        newSelectedEnclaveId: null,
                        newInspectedEnclaveId: selectedEnclaveId,
                        isCardVisible: true,
                        updatedOrders: updatedOrders,
                        vfxToPlay: { key: vfxKey, center: clickedEnclave.center },
                        sfxToPlay: sfxKey,
                    };
                }
            } else { // Attack order is always valid if route exists
                 const vfxKey = `order-${orderType}`;
                 const sfxKey = `game-order-issue-${orderType}`;
                 const updatedOrders = { ...pendingOrders, [selectedEnclaveId]: { to: clickedEnclaveId, type: orderType }};

                 return {
                     newSelectedEnclaveId: null,
                     newInspectedEnclaveId: selectedEnclaveId,
                     isCardVisible: true,
                     updatedOrders: updatedOrders,
                     vfxToPlay: { key: vfxKey, center: clickedEnclave.center },
                     sfxToPlay: sfxKey,
                 };
            }
        }
        
        // Clicked on something invalid while having a selection, so deselect and inspect the new thing
        return {
            newSelectedEnclaveId: null,
            newInspectedEnclaveId: clickedEnclaveId,
            isCardVisible: true,
            updatedOrders: pendingOrders,
            vfxToPlay: null,
            sfxToPlay: 'game-command-mode-exit',
        };
    } else {
        // No selection, so select if possible, and inspect
        const isSelectable = clickedEnclave.owner === 'player-1';
        return {
            newSelectedEnclaveId: isSelectable ? clickedEnclaveId : null,
            newInspectedEnclaveId: clickedEnclaveId,
            isCardVisible: true,
            updatedOrders: pendingOrders,
            vfxToPlay: null,
            sfxToPlay: isSelectable ? 'game-command-mode-enter' : null,
        };
    }
};

export const handleDoubleClick = (
    enclaveId: number | null,
    enclaveData: { [id: number]: Enclave },
    pendingOrders: PendingOrders
) => {
    if (enclaveId === null) return { updatedOrders: pendingOrders, vfxToPlay: null, sfxToPlay: null };
    
    const enclaveToHold = enclaveData[enclaveId];
    if (enclaveToHold && enclaveToHold.owner === 'player-1' && pendingOrders[enclaveId]) {
        const newOrders = { ...pendingOrders };
        delete newOrders[enclaveId];
        return {
            updatedOrders: newOrders,
            vfxToPlay: { key: 'order-holding', center: enclaveToHold.center },
            sfxToPlay: 'game-order-issue-hold',
        };
    }

    return { updatedOrders: pendingOrders, vfxToPlay: null, sfxToPlay: null };
};