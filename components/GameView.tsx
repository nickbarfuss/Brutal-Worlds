
import React, { useState, useRef, useEffect } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import Loader from './Loader';
import GameStartDialog from './GameStartDialog';
import MainScreen from './MainScreen';
// Re-enable GameScreen to test the rendering pipeline.
import GameScreen from './GameScreen';
import Backdrop from './ui/Backdrop';
import { AudioChannel } from '../types/game';

const GameView: React.FC = () => {
    const engine = useGameEngine();
    const [isClosingStartDialog, setIsClosingStartDialog] = useState(false);
    const closeDialogTimeoutRef = useRef<number | null>(null);
    const isStartingGameRef = useRef(false); // State lock to prevent race conditions

    useEffect(() => {
        // Cleanup timeout on unmount to prevent state updates on an unmounted component.
        return () => {
            if (closeDialogTimeoutRef.current) {
                clearTimeout(closeDialogTimeoutRef.current);
            }
        };
    }, []);

    const handleCloseStartDialog = () => {
        // If the game is already in the process of starting, ignore close requests.
        if (isStartingGameRef.current) return;

        setIsClosingStartDialog(true);
        if (closeDialogTimeoutRef.current) clearTimeout(closeDialogTimeoutRef.current);
        closeDialogTimeoutRef.current = window.setTimeout(() => {
            engine.closeArchetypeSelection();
            setIsClosingStartDialog(false); // Reset for next time
        }, 300); // Animation duration should match backdrop
    };

    const handleConfirmStartDialog = (archetypeKey: string, worldKey: string, archetypeSkinIndex: number) => {
        // Engage the lock to prevent interruptions.
        isStartingGameRef.current = true;
        
        // FIX: Clear any pending close-dialog timeouts to prevent a race condition
        // where the game phase is incorrectly reset to 'mainMenu' after starting.
        if (closeDialogTimeoutRef.current) {
            clearTimeout(closeDialogTimeoutRef.current);
        }
        
        // FIX: Explicitly reset the closing state to prevent the dialog from
        // getting "stuck" if confirm is clicked during the closing animation. This
        // guarantees a clean transition to the game screen.
        setIsClosingStartDialog(false);

        engine.sfxManager.playSound('ui-button-dialog-complete', 'ui');
        engine.startGame(archetypeKey, worldKey, archetypeSkinIndex);
    };
    
    const handleBegin = () => {
        // Reset the lock when opening the dialog.
        isStartingGameRef.current = false;

        // FIX: Clear any pending close-dialog timeouts to prevent a race condition
        // where a rapid close-then-open action causes the dialog to immediately close itself.
        if (closeDialogTimeoutRef.current) {
            clearTimeout(closeDialogTimeoutRef.current);
        }
        setIsClosingStartDialog(false);
        engine.sfxManager.handleUserInteraction();
        engine.sfxManager.playSound('ui-button-game-start', 'ui');
        engine.openArchetypeSelection();
    };

    const handleInteraction = () => {
        engine.sfxManager.handleUserInteraction();
    };

    // ARCHITECTURAL FIX: Check for a fatal error first, regardless of game phase.
    // This provides a robust, top-level error boundary that was previously missing.
    if (engine.error) {
        return <Loader text={engine.error} hasError={true} />;
    }
    
    if (engine.gamePhase === 'loading' || !engine.isInitialized) {
        return <Loader text={engine.loadingMessage} />;
    }

    const showStartDialog = engine.gamePhase === 'archetypeSelection' || isClosingStartDialog;

    if (engine.gamePhase === 'mainMenu' || showStartDialog) {
        return (
            <>
                <MainScreen onBegin={handleBegin} onInteraction={handleInteraction} />
                {showStartDialog && (
                    <>
                        <Backdrop isClosing={isClosingStartDialog} />
                        <GameStartDialog
                            onConfirm={handleConfirmStartDialog}
                            onClose={handleCloseStartDialog}
                            isClosing={isClosingStartDialog}
                            playSound={(key: string, channel?: AudioChannel) => engine.sfxManager.playSound(key, channel)}
                        />
                    </>
                )}
            </>
        );
    }
    
    // The actual game screen is now re-enabled to test the 3D rendering pipeline.
    // The background worker remains disabled, so the game will not be interactive.
    // For 'playing' and 'gameOver' phases
    if (engine.gamePhase === 'playing' || engine.gamePhase === 'gameOver') {
        return <GameScreen engine={engine} />;
    }

    return null; // Fallback for any unhandled game phase
};

export default GameView;