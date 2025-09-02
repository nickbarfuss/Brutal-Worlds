import { GameState, IntroStep } from '../../types/game';
import { Action } from './index';

// Update the introSequence array to match the new, user-defined cinematic steps.
const introSequence: IntroStep[] = ['warp', 'zoom', 'reveal'];

export const handleIntro = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'SET_INTRO_STEP':
            return { ...state, introStep: action.payload };

        case 'ADVANCE_INTRO': {
            const currentIndex = introSequence.indexOf(state.introStep);
            if (currentIndex === -1 || currentIndex === introSequence.length - 1) {
                // If we're at the end or in a weird state, complete the intro but remain paused for Turn 0.
                return { ...state, introStep: 'none', isIntroComplete: true };
            }
            const nextStep = introSequence[currentIndex + 1];
            return { ...state, introStep: nextStep };
        }

        case 'ON_INTRO_COMPLETE': // Kept for potential direct calls, though ADVANCE_INTRO is preferred
            return { ...state, introStep: 'none', isIntroComplete: true };

        default:
            return state;
    }
};