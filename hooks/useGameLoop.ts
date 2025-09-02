

import { useEffect, useRef } from 'react';
import { GamePhase, WorldProfile } from '../types/game';
import { GAME_CONFIG } from '../data/config';

export const useGameLoop = (
    isPaused: boolean,
    gamePhase: GamePhase,
    currentWorld: WorldProfile | null,
    currentTurn: number,
    resolveTurn: () => void,
    triggerDisaster: (key: string) => void
) => {
    const turnStartTimeRef = useRef<number | null>(null);
    const pauseStartRef = useRef<number | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        const loop = (timestamp: number) => {
            animationFrameId = requestAnimationFrame(loop);
            if (isPaused || gamePhase !== 'playing' || currentTurn === 0) {
                if (!pauseStartRef.current) pauseStartRef.current = timestamp;
                return;
            }

            if (pauseStartRef.current && turnStartTimeRef.current) {
                const pauseDuration = timestamp - pauseStartRef.current;
                turnStartTimeRef.current += pauseDuration;
                pauseStartRef.current = null;
            }

            if (!turnStartTimeRef.current) return;

            const elapsed = timestamp - turnStartTimeRef.current;
            if (elapsed >= GAME_CONFIG.TURN_DURATION * 1000) {
                turnStartTimeRef.current = timestamp;
                
                // The automatic disaster system is now re-enabled.
                if (currentWorld && Math.random() < currentWorld.disasterChance) {
                    const disasterKeys = currentWorld.possibleDisasters;
                    if (disasterKeys && disasterKeys.length > 0) {
                        const chosenKey = disasterKeys[Math.floor(Math.random() * disasterKeys.length)];
                        triggerDisaster(chosenKey);
                    }
                }
                resolveTurn();
            }
        };

        animationFrameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused, resolveTurn, currentWorld, gamePhase, currentTurn, triggerDisaster]);

    return { turnStartTimeRef, pauseStartRef };
};