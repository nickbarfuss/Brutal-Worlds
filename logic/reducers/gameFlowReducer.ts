import { GameState, ActiveGambit, GambitState } from '../../types/game';
import { Action, initialState } from './index';
import { WORLD_LIBRARY } from '../../data/worlds';
import { ARCHETYPES } from '../../data/archetypes';
import { GAMBITS } from '../../data/gambits';
import { generateNewWorld } from '../../hooks/useWorldGenerator';

export const handleGameFlow = (state: GameState, action: Action, baseInitialState: GameState): GameState => {
    switch (action.type) {
        case 'SET_GAME_PHASE':
            return { ...state, gamePhase: action.payload };

        case 'TOGGLE_PAUSE':
            return { ...state, isPaused: !state.isPaused };

        case 'GO_TO_MAIN_MENU':
            // FIX: Ensure a clean state by starting from the initial state and only carrying over
            // user settings. This prevents any lingering game data (like session ID) from causing
            // race conditions or state inconsistencies.
            return {
                ...initialState,
                isInitialized: state.isInitialized,
                gamePhase: 'mainMenu',
                // Carry over user settings
                volumes: state.volumes,
                mutedChannels: state.mutedChannels,
                isBloomEnabled: state.isBloomEnabled,
                bloomSettings: state.bloomSettings,
                materialSettings: state.materialSettings,
                ambientLightIntensity: state.ambientLightIntensity,
                tonemappingStrength: state.tonemappingStrength,
            };

        case 'START_GAME': {
            const { playerArchetypeKey, worldKey, playerArchetypeSkinIndex } = action.payload;
            const worldProfile = WORLD_LIBRARY.find(w => w.key === worldKey);
            if (!worldProfile) return { ...state, error: `Selected world "${worldKey}" could not be loaded.` };

            const archetypeKeys = Object.keys(ARCHETYPES);
            const opponentArchetypeKey = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
            
            const opponentArchetype = ARCHETYPES[opponentArchetypeKey];
            const opponentArchetypeSkinIndex = (opponentArchetype.skins && opponentArchetype.skins.length > 0)
                ? Math.floor(Math.random() * opponentArchetype.skins.length)
                : 0;


            const { newMapData, newEnclaveData, newDomainData, newRiftData, newExpanseData, newRoutes, planetName } = generateNewWorld(worldProfile);
            Object.values(newEnclaveData).forEach(enclave => {
                if (enclave.owner === 'player-1') enclave.archetypeKey = playerArchetypeKey;
                else if (enclave.owner === 'player-2') enclave.archetypeKey = opponentArchetypeKey;
            });

            const playerStartEnclave = Object.values(newEnclaveData).find(e => e.owner === 'player-1');

            // Apply world-specific settings, but fall back to the player's CURRENT settings, not the initial defaults.
            const bloomSettings = (state.isBloomEnabled && worldProfile.bloom)
                ? worldProfile.bloom
                : state.bloomSettings;
            const tonemappingStrength = worldProfile.tonemappingStrength ?? state.tonemappingStrength;

            return {
                ...baseInitialState, // Reset game logic state
                isInitialized: state.isInitialized, // Preserve initialization status
                // FIX: Use an incrementing counter for the session ID to guarantee uniqueness
                // and prevent a race condition with the web worker.
                gameSessionId: (state.gameSessionId || 0) + 1,
                
                // Carry over user settings.
                volumes: state.volumes,
                mutedChannels: state.mutedChannels,
                materialSettings: state.materialSettings,
                ambientLightIntensity: state.ambientLightIntensity,

                // Apply new game's settings
                isBloomEnabled: state.isBloomEnabled, // Respect user's on/off preference
                bloomSettings: bloomSettings,
                tonemappingStrength: tonemappingStrength,

                // New game state setup
                gamePhase: 'playing', 
                currentTurn: 0, // Start at "Turn 0"
                playerArchetypeKey, 
                playerArchetypeSkinIndex,
                opponentArchetypeKey, 
                opponentArchetypeSkinIndex,
                currentWorld: worldProfile,
                mapData: newMapData, enclaveData: newEnclaveData, domainData: newDomainData, riftData: newRiftData,
                expanseData: newExpanseData, routes: newRoutes, planetName,
                playerGambits: [], // Gambit system is disabled, ensure this is empty.
                opponentGambits: [], // Gambit system is disabled, ensure this is empty.
                introStep: 'warp',
                initialCameraTarget: playerStartEnclave ? playerStartEnclave.center.clone() : null,
                activeHighlight: null,
            };
        }

        case 'RESET_GAME':
             // FIX: Ensure a clean state by starting from the initial state and only carrying over
            // user settings. This provides a more robust reset than preserving old state.
            return {
                ...initialState,
                isInitialized: state.isInitialized,
                gamePhase: 'archetypeSelection',
                // Carry over user settings
                volumes: state.volumes,
                mutedChannels: state.mutedChannels,
                isBloomEnabled: state.isBloomEnabled,
                bloomSettings: state.bloomSettings,
                materialSettings: state.materialSettings,
                ambientLightIntensity: state.ambientLightIntensity,
                tonemappingStrength: state.tonemappingStrength,
            };

        default:
            return state;
    }
};