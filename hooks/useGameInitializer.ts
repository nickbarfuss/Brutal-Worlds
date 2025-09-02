

import React, { useEffect } from 'react';
import * as THREE from 'three';
import { VfxManager } from '../logic/VfxManager';
import { SfxManager } from '../logic/SfxManager';
import { ORDER_PROFILES } from '../data/orders';
import { VFX_PROFILES as GENERAL_VFX_PROFILES } from '../data/vfx';
import { DISASTER_PROFILES } from '../data/disasters';
import { WORLD_LIBRARY } from '../data/worlds';
import { ARCHETYPES } from '../data/archetypes';
import { GamePhase, Enclave, Route, MapCell, PendingOrders } from '../types/game';
import { GAME_CONFIG } from '../data/config';
import { resolveTurn } from '../logic/turnResolver';
import { generateNewWorld } from './useWorldGenerator';

const preloadFonts = async (): Promise<void> => {
    if (!document.fonts) {
        console.warn('Font loading API not supported, skipping font preloading.');
        return;
    }
    try {
        await Promise.all([
            document.fonts.load('1em "Open Sans"'),
            document.fonts.load('1em "Material Symbols Outlined"'),
            document.fonts.load('1em "Dungeon Depths"'),
        ]);
    } catch (error) {
        console.warn("Could not preload one or more fonts. The app will continue but may not look correct.", error);
    }
};

export const useGameInitializer = (
    vfxManager: React.RefObject<VfxManager>,
    sfxManager: React.RefObject<SfxManager>,
    startGame: (archetypeKey: string, worldKey: string, skinIndex: number) => void,
    setGamePhase: (phase: GamePhase) => void,
    setInitializationState: (isInitialized: boolean, message: string, error: string | null) => void
) => {
    useEffect(() => {
        const initialize = async () => {
            try {
                const onProgress = (message: string) => {
                    setInitializationState(false, message, null);
                };

                onProgress('Loading typography');
                await preloadFonts();
                
                onProgress('Initializing VFX engine');
                await vfxManager.current?.init({
                    disasters: DISASTER_PROFILES,
                    orders: ORDER_PROFILES,
                    general: GENERAL_VFX_PROFILES,
                });
                onProgress('Initializing SFX engine');
                await sfxManager.current?.init();
                

                // PER USER REQUEST: QUICK_START logic is disabled to focus on loading the main menu.
                onProgress('Ready for command');
                setGamePhase('mainMenu');
                setInitializationState(true, '', null);
                
            } catch (err) {
                console.error("Failed to initialize game engine:", err);
                const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
                setInitializationState(false, '', `Initialization Failed: ${errorMessage}`);
            }
        };
        initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // This effect should run only once.
};
