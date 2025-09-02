
import { GameState, ActiveHighlight, AudioChannel } from '../../types/game';
import { Action } from './index';

export const handleUi = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        case 'SET_ACTIVE_HIGHLIGHT':
            return {
                ...state,
                activeHighlight: action.payload as ActiveHighlight | null
            };
        case 'TOGGLE_SETTINGS_DRAWER':
            return { ...state, isSettingsOpen: !state.isSettingsOpen };
        case 'SET_VOLUME':
            // When volume is adjusted, unmute the channel
            return {
                ...state,
                volumes: {
                    ...state.volumes,
                    [action.payload.channel]: action.payload.volume,
                },
                mutedChannels: {
                    ...state.mutedChannels,
                    [action.payload.channel]: false,
                }
            };
        case 'TOGGLE_MUTE_CHANNEL':
            return {
                ...state,
                mutedChannels: {
                    ...state.mutedChannels,
                    [action.payload]: !state.mutedChannels[action.payload],
                }
            };
        case 'SET_BLOOM_ENABLED':
            return { ...state, isBloomEnabled: action.payload };
        case 'SET_BLOOM_VALUE':
            return {
                ...state,
                bloomSettings: {
                    ...state.bloomSettings,
                    [action.payload.key]: action.payload.value,
                }
            };
        case 'SET_MATERIAL_VALUE': {
            const { type, key, value } = action.payload;
            return {
                ...state,
                materialSettings: {
                    ...state.materialSettings,
                    [type]: {
                        ...state.materialSettings[type],
                        [key]: value,
                    },
                },
            };
        }
        case 'SET_AMBIENT_LIGHT_INTENSITY':
            return {
                ...state,
                ambientLightIntensity: action.payload,
            };
        case 'SET_TONEMAPPING_STRENGTH':
            return {
                ...state,
                tonemappingStrength: action.payload,
            };
        default:
            return state;
    }
};