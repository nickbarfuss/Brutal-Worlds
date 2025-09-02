
import { GameState, GamePhase, InspectedEntity, IntroStep, ActiveHighlight, AudioChannel, MaterialProperties } from '../../types/game';
import { GAME_CONFIG } from '../../data/config';
import { handleInitialization } from './initializationReducer';
import { handleGameFlow } from './gameFlowReducer';
import { handleIntro } from './introReducer';
import { handleMapInteraction } from './mapInteractionReducer';
import { handleTurnLogic } from './turnLogicReducer';
import { handleDisasters } from './disasterReducer';
import { handleFx } from './vfxReducer';
import { handleUi } from './uiReducer';

export type Action =
    | { type: 'SET_INITIALIZATION_STATE'; payload: { isInitialized: boolean; message: string; error: string | null } }
    | { type: 'SET_GAME_PHASE'; payload: GamePhase }
    | { type: 'START_GAME'; payload: { playerArchetypeKey: string; worldKey: string; playerArchetypeSkinIndex: number; } }
    | { type: 'RESET_GAME' }
    | { type: 'TOGGLE_PAUSE' }
    | { type: 'SET_HOVERED_CELL'; payload: number }
    | { type: 'HANDLE_MAP_CLICK'; payload: number | null }
    | { type: 'HANDLE_DBL_CLICK'; payload: number | null }
    | { type: 'FOCUS_ON_ENCLAVE'; payload: number }
    | { type: 'SET_INSPECTED_ENTITY'; payload: InspectedEntity | null }
    | { type: 'START_RESOLVING_TURN' }
    | { type: 'APPLY_RESOLVED_TURN'; payload: any }
    | { type: 'START_FIRST_TURN' }
    | { type: 'TRIGGER_DISASTER'; payload: string }
    | { type: 'SET_INTRO_STEP'; payload: IntroStep }
    | { type: 'ADVANCE_INTRO' }
    | { type: 'ON_INTRO_COMPLETE' }
    | { type: 'CLEAR_LATEST_DISASTER' }
    | { type: 'UPDATE_VFX_SFX' }
    | { type: 'CLEAR_VFX' }
    | { type: 'CLEAR_SFX' }
    | { type: 'GO_TO_MAIN_MENU' }
    | { type: 'SET_ACTIVE_HIGHLIGHT'; payload: ActiveHighlight | null }
    | { type: 'TOGGLE_SETTINGS_DRAWER' }
    | { type: 'SET_VOLUME'; payload: { channel: AudioChannel; volume: number } }
    | { type: 'TOGGLE_MUTE_CHANNEL'; payload: AudioChannel }
    | { type: 'SET_BLOOM_ENABLED'; payload: boolean }
    | { type: 'SET_BLOOM_VALUE'; payload: { key: 'threshold' | 'strength' | 'radius'; value: number } }
    | { type: 'SET_MATERIAL_VALUE'; payload: { type: keyof GameState['materialSettings'], key: keyof MaterialProperties, value: number } }
    | { type: 'SET_AMBIENT_LIGHT_INTENSITY'; payload: number }
    | { type: 'SET_TONEMAPPING_STRENGTH'; payload: number };

export const initialState: GameState = {
    mapData: [], enclaveData: {}, domainData: {}, riftData: {}, expanseData: {}, routes: [],
    planetName: '', isInitialized: false, error: null, currentTurn: 0, pendingOrders: {}, latestDisaster: null, activeDisasterMarkers: [],
    loadingMessage: 'Initializing', currentWorld: null, gameConfig: GAME_CONFIG, gamePhase: 'loading',
    gameSessionId: 0,
    playerArchetypeKey: null, playerArchetypeSkinIndex: null, opponentArchetypeKey: null, opponentArchetypeSkinIndex: null, 
    playerGambits: [], opponentGambits: [],
    hoveredCellId: -1, selectedEnclaveId: null, inspectedEntity: null, isCardVisible: false,
    isIntroComplete: false, introStep: 'warp', cameraFocusAnimation: null, hoveredEntity: null,
    isPaused: true, initialCameraTarget: null, vfxToPlay: null, sfxToPlay: null, activeHighlight: null,
    isSettingsOpen: false,
    isResolvingTurn: false,
    gameOverState: 'none',
    volumes: { fx: 0.7, ambient: 0.28, music: 0.6, ui: 0.6 },
    mutedChannels: { fx: false, ambient: false, music: false, ui: false },
    isBloomEnabled: GAME_CONFIG.ENABLE_BLOOM_EFFECT,
    bloomSettings: { threshold: 0.5, strength: 0.5, radius: 1.0 },
    materialSettings: {
        player: { metalness: 0.0, roughness: 1.0, emissiveIntensity: 1.0 },
        neutral: { metalness: 0.0, roughness: 1.0, emissiveIntensity: 0.3 },
        void: { metalness: 0.0, roughness: 0.5, emissiveIntensity: 0.2 },
    },
    ambientLightIntensity: 1.0,
    tonemappingStrength: 1.0,
};

export const reducer = (state: GameState, action: Action): GameState => {
    switch (action.type) {
        // Initialization
        case 'SET_INITIALIZATION_STATE':
            return handleInitialization(state, action);

        // Game Flow
        case 'SET_GAME_PHASE':
        case 'TOGGLE_PAUSE':
        case 'GO_TO_MAIN_MENU':
        case 'START_GAME':
        case 'RESET_GAME':
            return handleGameFlow(state, action, initialState);

        // Intro Sequence
        case 'SET_INTRO_STEP':
        case 'ON_INTRO_COMPLETE':
        case 'ADVANCE_INTRO':
            return handleIntro(state, action);

        // Map Interaction
        case 'SET_HOVERED_CELL':
        case 'HANDLE_MAP_CLICK':
        case 'HANDLE_DBL_CLICK':
        case 'FOCUS_ON_ENCLAVE':
        case 'SET_INSPECTED_ENTITY':
            return handleMapInteraction(state, action);
            
        // Turn Logic
        case 'START_FIRST_TURN':
        case 'START_RESOLVING_TURN':
        case 'APPLY_RESOLVED_TURN':
            return handleTurnLogic(state, action);

        // Disasters
        case 'TRIGGER_DISASTER':
        case 'CLEAR_LATEST_DISASTER':
            return handleDisasters(state, action);

        // VFX/SFX
        case 'UPDATE_VFX_SFX':
        case 'CLEAR_VFX':
        case 'CLEAR_SFX':
            return handleFx(state, action);

        // UI
        case 'SET_ACTIVE_HIGHLIGHT':
        case 'TOGGLE_SETTINGS_DRAWER':
        case 'SET_VOLUME':
        case 'TOGGLE_MUTE_CHANNEL':
        case 'SET_BLOOM_ENABLED':
        case 'SET_BLOOM_VALUE':
        case 'SET_MATERIAL_VALUE':
        case 'SET_AMBIENT_LIGHT_INTENSITY':
        case 'SET_TONEMAPPING_STRENGTH':
            return handleUi(state, action);

        default:
            return state;
    }
};