
import { useCallback, useRef, useEffect, useReducer } from 'react';
import * as THREE from 'three';
import {
    Enclave, Domain, Rift, Expanse, Route, MapCell, PendingOrders, InspectedEntity, GamePhase, ActiveDisasterMarker, ActiveGambit, IntroStep, GameState, ActiveHighlight, AudioChannel, MaterialProperties
} from '../types/game';
import { VfxManager } from '../logic/VfxManager';
import { SfxManager } from '../logic/SfxManager';
import { useGameInitializer } from './useGameInitializer';
import { useGameLoop } from './useGameLoop';
import { reducer as gameReducer, initialState, Action } from '../logic/reducers';
import { deserializeResolvedTurn, serializeGameStateForWorker } from '../utils/threeUtils';


// DEV NOTE: Remember to update metadata.json version for new features/fixes.

export const useGameEngine = () => {
    const vfxManager = useRef(new VfxManager());
    const sfxManager = useRef(new SfxManager());
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const workerRef = useRef<Worker | null>(null);
    
    // Use a ref to track the current session ID. This allows the worker's message handler,
    // which is only created once, to access the latest session ID without needing to be re-created.
    const gameSessionIdRef = useRef<number>(state.gameSessionId);
    gameSessionIdRef.current = state.gameSessionId;

    // Create a ref to track the current game phase. This is crucial for the worker
    // message handler, which is only created once but needs access to the latest phase.
    const gamePhaseRef = useRef<GamePhase>(state.gamePhase);
    gamePhaseRef.current = state.gamePhase;


    // --- State-dispatching callbacks ---
    const setInitializationState = useCallback((isInitialized, message, error) => {
        dispatch({ type: 'SET_INITIALIZATION_STATE', payload: { isInitialized, message, error } });
    }, []);

    const setGamePhase = useCallback((phase: GamePhase) => dispatch({ type: 'SET_GAME_PHASE', payload: phase }), []);
    const startGame = useCallback((playerArchetypeKey: string, worldKey: string, playerArchetypeSkinIndex: number) => {
        vfxManager.current.reset();
        dispatch({ type: 'START_GAME', payload: { playerArchetypeKey, worldKey, playerArchetypeSkinIndex } });
    }, []);

    const resetGame = useCallback(() => {
        sfxManager.current.reset();
        dispatch({ type: 'RESET_GAME' });
    }, []);
    const togglePause = useCallback(() => dispatch({ type: 'TOGGLE_PAUSE' }), []);
    const goToMainMenu = useCallback(() => {
        sfxManager.current.reset();
        dispatch({ type: 'GO_TO_MAIN_MENU' });
    }, []);
    
    useEffect(() => {
        // This effect runs only once to initialize the web worker.
        try {
            // ARCHITECTURAL FIX: Construct a full, absolute, same-origin URL for the worker.
            // This is the definitive fix for the Cross-Origin (CORS) and module resolution
            // errors encountered in the sandboxed environment. It provides an unambiguous,
            // secure URL that the browser can trust, allowing the worker to load and
            // resolve its own internal (relative) imports correctly.
            const workerUrl = new URL('/logic/turnResolver.worker.ts', window.location.origin);
            
            workerRef.current = new Worker(workerUrl, { type: 'module' });

            const handleMessage = (e: MessageEvent) => {
                try {
                    const result = JSON.parse(e.data);

                    // DIAGNOSTIC FIX: Correctly process the specific error message from the worker
                    // instead of showing a generic one. This is crucial for debugging.
                    if (result.error) {
                        console.error("Worker Error:", result.error);
                        dispatch({ type: 'SET_INITIALIZATION_STATE', payload: { isInitialized: true, message: '', error: result.error } });
                        return;
                    }
                    
                    if (result.gameSessionId !== gameSessionIdRef.current || gamePhaseRef.current !== 'playing') {
                        console.log(`Ignoring stale/irrelevant turn result from session ${result.gameSessionId} (current is ${gameSessionIdRef.current}, phase is ${gamePhaseRef.current})`);
                        return;
                    }

                    const deserializedResult = deserializeResolvedTurn(result);
                    dispatch({ type: 'APPLY_RESOLVED_TURN', payload: deserializedResult });
                } catch (error) {
                    console.error("Error processing message from worker:", error, "Data:", e.data);
                    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while processing the turn.";
                    dispatch({ type: 'SET_INITIALIZATION_STATE', payload: { isInitialized: true, message: '', error: `Could not process turn result: ${errorMessage}` });
                }
            };

            workerRef.current?.addEventListener('message', handleMessage);
            
            if (workerRef.current) {
                workerRef.current.onerror = (e) => {
                    console.error("A fatal worker error occurred:", e);
                    const errorMessage = e.message 
                        ? `${e.message} (in ${e.filename}:${e.lineno})` 
                        : 'A fatal error occurred in the background process.';
                    dispatch({ 
                        type: 'SET_INITIALIZATION_STATE', 
                        payload: { isInitialized: true, message: '', error: errorMessage } 
                    });
                };
            }
        } catch (e) {
            console.error("Failed to create web worker:", e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred while creating the background process.";
            dispatch({
                type: 'SET_INITIALIZATION_STATE',
                payload: { isInitialized: true, message: '', error: `Worker creation failed: ${errorMessage}` }
            });
        }

        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []); // This should run only once.

    // This effect manages the lifecycle of the disaster snackbar timeout.
    // It is now tied directly to the lifecycle of the `latestDisaster` state.
    useEffect(() => {
        if (state.latestDisaster) {
            const timerId = setTimeout(() => {
                dispatch({ type: 'CLEAR_LATEST_DISASTER' });
            }, 5100);

            // This cleanup function will automatically run if the component unmounts
            // or if `state.latestDisaster` changes, preventing memory leaks and
            // state updates on unmounted components.
            return () => clearTimeout(timerId);
        }
    }, [state.latestDisaster, dispatch]);


    const resolveTurn = useCallback(() => {
        if (state.isResolvingTurn || !workerRef.current) return;

        dispatch({ type: 'START_RESOLVING_TURN' });
    
        const serializableState = serializeGameStateForWorker({
            enclaveData: state.enclaveData,
            pendingOrders: state.pendingOrders,
            routes: state.routes,
            currentTurn: state.currentTurn,
            gameSessionId: state.gameSessionId,
            activeDisasterMarkers: state.activeDisasterMarkers,
        });
        
        workerRef.current.postMessage(JSON.stringify(serializableState));
    }, [state.enclaveData, state.pendingOrders, state.routes, state.currentTurn, state.isResolvingTurn, state.gameSessionId, state.activeDisasterMarkers]);
    
    const clearLatestDisaster = useCallback(() => dispatch({ type: 'CLEAR_LATEST_DISASTER' }), []);
    
    // The timeout logic has been moved to a dedicated useEffect for better lifecycle management.
    const triggerDisaster = useCallback((key: string) => {
        dispatch({ type: 'TRIGGER_DISASTER', payload: key });
    }, []);
    
    const onIntroStepComplete = useCallback(() => {
        dispatch({ type: 'ADVANCE_INTRO' });
    }, []);

    const setHoveredCellId = useCallback((id: number) => dispatch({ type: 'SET_HOVERED_CELL', payload: id }), []);
    const handleMapClick = useCallback((cellId: number | null) => {
        dispatch({ type: 'HANDLE_MAP_CLICK', payload: cellId });
    }, []);
    const handleEnclaveDblClick = useCallback((enclaveId: number | null) => dispatch({ type: 'HANDLE_DBL_CLICK', payload: enclaveId }), []);
    const focusOnEnclave = useCallback((id: number) => dispatch({ type: 'FOCUS_ON_ENCLAVE', payload: id }), []);
    const setInspectedEntity = useCallback((entity: InspectedEntity | null) => dispatch({ type: 'SET_INSPECTED_ENTITY', payload: entity }), []);
    const setActiveHighlight = useCallback((highlight: ActiveHighlight | null) => dispatch({ type: 'SET_ACTIVE_HIGHLIGHT', payload: highlight }), []);
    const toggleSettingsDrawer = useCallback(() => dispatch({ type: 'TOGGLE_SETTINGS_DRAWER' }), []);
    
    const setVolume = useCallback((channel: AudioChannel, volume: number) => {
        sfxManager.current.setVolume(channel, volume);
        dispatch({ type: 'SET_VOLUME', payload: { channel, volume } });
    }, []);
    const toggleMuteChannel = useCallback((channel: AudioChannel) => {
        const isMuted = !state.mutedChannels[channel];
        sfxManager.current.setMuted(channel, isMuted);
        dispatch({ type: 'TOGGLE_MUTE_CHANNEL', payload: channel });
    }, [state.mutedChannels]);
    const setBloomEnabled = useCallback((enabled: boolean) => dispatch({ type: 'SET_BLOOM_ENABLED', payload: enabled }), []);
    const setBloomValue = useCallback((key: 'threshold' | 'strength' | 'radius', value: number) => {
        dispatch({ type: 'SET_BLOOM_VALUE', payload: { key, value } });
    }, []);
    const setMaterialValue = useCallback((type: keyof GameState['materialSettings'], key: keyof MaterialProperties, value: number) => {
        dispatch({ type: 'SET_MATERIAL_VALUE', payload: { type, key, value } });
    }, []);
    const setAmbientLightIntensity = useCallback((value: number) => {
        dispatch({ type: 'SET_AMBIENT_LIGHT_INTENSITY', payload: value });
    }, []);
    const setTonemappingStrength = useCallback((value: number) => {
        dispatch({ type: 'SET_TONEMAPPING_STRENGTH', payload: value });
    }, []);
    
    const { turnStartTimeRef } = useGameLoop(state.isPaused, state.gamePhase, state.currentWorld, state.currentTurn, resolveTurn, triggerDisaster);
    useGameInitializer(vfxManager, sfxManager, startGame, setGamePhase, setInitializationState);
    
    useEffect(() => {
        if (state.vfxToPlay) {
            vfxManager.current.playEffect(state.vfxToPlay.key, state.vfxToPlay.center);
            dispatch({ type: 'CLEAR_VFX' });
        }
    }, [state.vfxToPlay]);
    
    useEffect(() => {
        if (state.sfxToPlay) {
            sfxManager.current.playSound(state.sfxToPlay, 'fx');
            dispatch({ type: 'CLEAR_SFX' });
        }
    }, [state.sfxToPlay]);

    useEffect(() => {
        if (!state.isPaused) {
            Object.values(state.enclaveData).forEach(enclave => {
                if (enclave.vfxToPlayThisTurn && enclave.vfxToPlayThisTurn.length > 0) {
                    enclave.vfxToPlayThisTurn.forEach(vfxKey => vfxManager.current.playEffect(vfxKey, enclave.center));
                }
                 if (enclave.sfxToPlayThisTurn && enclave.sfxToPlayThisTurn.length > 0) {
                    enclave.sfxToPlayThisTurn.forEach(sfxKey => sfxManager.current.playSound(`game-${sfxKey}`));
                }
            });
            if (Object.values(state.enclaveData).some(e => (e.vfxToPlayThisTurn && e.vfxToPlayThisTurn.length > 0) || (e.sfxToPlayThisTurn && e.sfxToPlayThisTurn.length > 0))) {
                dispatch({ type: 'UPDATE_VFX_SFX' });
            }
        }
    }, [state.isPaused, state.enclaveData]);

    useEffect(() => {
        // This effect triggers the transition from the preparatory "Turn 0" to the first real turn.
        if (state.isIntroComplete && state.gamePhase === 'playing' && state.currentTurn === 0) {
            // A short delay gives the browser a moment to breathe after the intro animation.
            const timer = setTimeout(() => {
                dispatch({ type: 'START_FIRST_TURN' });
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [state.isIntroComplete, state.gamePhase, state.currentTurn]);

    useEffect(() => {
        // This effect runs when the first turn officially begins.
        if (state.isIntroComplete && state.gamePhase === 'playing' && state.currentTurn === 1 && !state.isPaused) {
            sfxManager.current.playLoop('ambient-gameplay-1', 'ambient');
        }
    }, [state.isIntroComplete, state.gamePhase, state.currentTurn, state.isPaused, resolveTurn]);
    
    useEffect(() => {
        const musicManager = sfxManager.current;
        const phase = state.gamePhase;

        if (phase === 'mainMenu' || phase === 'archetypeSelection' || phase === 'playing' || phase === 'gameOver') {
            musicManager.playLoopIfNotPlaying('music-track-1', 'music');
        }
    }, [state.gamePhase]);
    
    return {
        ...state,
        vfxManager: vfxManager.current,
        sfxManager: sfxManager.current,
        setGamePhase,
        startGame,
        resetGame,
        openArchetypeSelection: () => setGamePhase('archetypeSelection'),
        closeArchetypeSelection: () => setGamePhase('mainMenu'),
        goToMainMenu,
        togglePause,
        onIntroStepComplete,
        clearLatestDisaster,
        triggerDisaster,
        setHoveredCellId,
        handleMapClick,
        handleEnclaveDblClick,
        focusOnEnclave,
        setInspectedEntity,
        setActiveHighlight,
        toggleSettingsDrawer,
        setVolume,
        toggleMuteChannel,
        setBloomEnabled,
        setBloomValue,
        setMaterialValue,
        setAmbientLightIntensity,
        setTonemappingStrength,
    };
};
