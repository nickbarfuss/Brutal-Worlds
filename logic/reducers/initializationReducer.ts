
import { GameState } from '../../types/game';
import { Action } from './index';

export const handleInitialization = (state: GameState, action: Action): GameState => {
    if (action.type === 'SET_INITIALIZATION_STATE') {
        return { ...state, ...action.payload };
    }
    return state;
};
