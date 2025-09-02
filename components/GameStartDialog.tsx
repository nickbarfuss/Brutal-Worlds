
import React, { useState, useRef, useEffect } from 'react';
import { ARCHETYPES } from '../data/archetypes';
import { WORLD_LIBRARY } from '../data/worlds';
import ButtonBasic from './ui/ButtonBasic';
import ArchetypeSelectionCard from './ArchetypeSelectionCard';
import WorldSelectionCard from './WorldSelectionCard';
import { AudioChannel } from '../types/game';

interface GameStartDialogProps {
    onConfirm: (archetypeKey: string, worldKey: string, skinIndex: number) => void;
    onClose: () => void;
    isClosing: boolean;
    playSound: (key: string, channel?: AudioChannel) => void;
}

type DialogStep = 'archetype' | 'world';

const GameStartDialog: React.FC<GameStartDialogProps> = ({ onConfirm, onClose, isClosing, playSound }) => {
    const [step, setStep] = useState<DialogStep>('archetype');
    const [selectedArchetypeKey, setSelectedArchetypeKey] = useState<string | null>(null);
    const [selectedWorldKey, setSelectedWorldKey] = useState<string | null>(null);
    const [selectedArchetypeSkins, setSelectedArchetypeSkins] = useState<Record<string, number>>({});

    const sliderRef = useRef<HTMLDivElement>(null);
    const archetypeCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const worldCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const [isDown, setIsDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragTimeoutRef = useRef<number | null>(null);

    const sortedArchetypes = Object.values(ARCHETYPES).sort((a, b) => a.name.localeCompare(b.name));
    const sortedWorlds = [...WORLD_LIBRARY].sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        const initialSkins: Record<string, number> = {};
        sortedArchetypes.forEach(archetype => {
            if (archetype.skins && archetype.skins.length > 0) {
                initialSkins[archetype.key] = Math.floor(Math.random() * archetype.skins.length);
            }
        });
        setSelectedArchetypeSkins(initialSkins);
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    // FIX: Add a cleanup for the drag timeout to prevent state updates on an unmounted component.
    // This is a critical fix for a race condition when the dialog closes immediately after a drag/click.
    useEffect(() => {
        return () => {
            if (dragTimeoutRef.current) {
                clearTimeout(dragTimeoutRef.current);
            }
        };
    }, []);

    const handleSkinChange = (archetypeKey: string, skinIndex: number) => {
        setSelectedArchetypeSkins(prev => ({
            ...prev,
            [archetypeKey]: skinIndex,
        }));
    };

    const handleSelectArchetype = (key: string) => {
        playSound('ui-tap-1', 'ui');
        const newKey = selectedArchetypeKey === key ? null : key;
        setSelectedArchetypeKey(newKey);
    
        // FIX: Only play a sound if a *new* archetype is selected. If `newKey` is
        // null (meaning the player deselected the current one), this block will be
        // skipped, preventing a crash from trying to pick a sound for a null key.
        if (newKey) {
            let soundKeys: string[] = [];
            switch (newKey) {
                case 'first-sword':
                    soundKeys = ['archetype-first-sword-1', 'archetype-first-sword-2', 'archetype-first-sword-3', 'archetype-first-sword-4'];
                    break;
                case 'pact-whisperer':
                    soundKeys = ['archetype-pact-whisperer-1', 'archetype-pact-whisperer-2', 'archetype-pact-whisperer-3', 'archetype-pact-whisperer-4'];
                    break;
                case 'labyrinthine-ghost':
                    soundKeys = ['archetype-labyrinthine-ghost-1', 'archetype-labyrinthine-ghost-2', 'archetype-labyrinthine-ghost-3', 'archetype-labyrinthine-ghost-4'];
                    break;
                case 'world-artificer':
                    soundKeys = ['archetype-world-artificer-1', 'archetype-world-artificer-2', 'archetype-world-artificer-3', 'archetype-world-artificer-4', 'archetype-world-artificer-5'];
                    break;
            }
    
            if (soundKeys.length > 0) {
                const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
                playSound(randomKey, 'fx');
            }
        }
    };

    const handleSelectWorld = (key: string) => {
        playSound('ui-tap-1', 'ui');
        const newKey = selectedWorldKey === key ? null : key;
        setSelectedWorldKey(newKey);
    };

    useEffect(() => {
        if (step !== 'archetype' || !selectedArchetypeKey) return;

        const timer = setTimeout(() => {
            const cardEl = archetypeCardRefs.current[selectedArchetypeKey];
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 50); // Using a small delay is safer than 0ms to allow layout reflow.

        return () => clearTimeout(timer); // Cleanup the timeout
    }, [selectedArchetypeKey, step]);

    useEffect(() => {
        if (step !== 'world' || !selectedWorldKey) return;

        const timer = setTimeout(() => {
            const cardEl = worldCardRefs.current[selectedWorldKey];
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [selectedWorldKey, step]);


    const handleNext = () => {
        if (selectedArchetypeKey) {
            playSound('ui-button-dialog-nav', 'ui');
            setStep('world');
        }
    };

    const handleBack = () => {
        playSound('ui-button-dialog-nav', 'ui');
        setStep('archetype');
    };

    const handleConfirm = () => {
        if (selectedArchetypeKey && selectedWorldKey) {
            const skinIndex = selectedArchetypeSkins[selectedArchetypeKey] ?? 0;
            onConfirm(selectedArchetypeKey, selectedWorldKey, skinIndex);
        }
    };
    
    const renderHeader = () => {
        if (step === 'archetype') {
            return (
                <>
                    <h2 className="text-3xl font-bold">Choose Your Archetype</h2>
                    <p className="text-lg text-neutral-400">Step 1 of 2</p>
                </>
            );
        }
        if (step === 'world') {
            return (
                <>
                    <h2 className="text-3xl font-bold">Select a World</h2>
                    <p className="text-lg text-neutral-400">Step 2 of 2</p>
                </>
            );
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current) return;
        setIsDown(true);
        setStartX(e.pageX - sliderRef.current.offsetLeft);
        setScrollLeft(sliderRef.current.scrollLeft);
        setIsDragging(false); // Reset dragging state on new mousedown
        sliderRef.current.classList.add('cursor-grabbing');
    };

    const handleMouseLeave = () => {
        if (!sliderRef.current) return;
        setIsDown(false);
        sliderRef.current.classList.remove('cursor-grabbing');
    };

    const handleMouseUp = () => {
        if (!sliderRef.current) return;
        setIsDown(false);
        sliderRef.current.classList.remove('cursor-grabbing');
        // A short delay helps distinguish between a click and a drag
        if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
        dragTimeoutRef.current = window.setTimeout(() => setIsDragging(false), 50);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDown || !sliderRef.current) return;
        e.preventDefault();
        const x = e.pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Multiplier for faster scrolling
        if (Math.abs(walk) > 5) { // Threshold to confirm it's a drag
            setIsDragging(true);
        }
        sliderRef.current.scrollLeft = scrollLeft - walk;
    };
    
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (sliderRef.current) {
            // No need for e.preventDefault() as horizontal scroll is not default
            sliderRef.current.scrollLeft += e.deltaY;
        }
    };

    const handleCardClick = (onClick: () => void) => {
        if (!isDragging) {
            onClick();
        }
    };
    
    const animationClass = isClosing ? 'animate-close-dialog' : 'animate-open-dialog';

    return (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${animationClass}`}>
            <div className="bg-neutral-900 relative flex flex-col w-full max-w-screen-xl rounded-2xl border border-neutral-700/50 shadow-2xl transition-all duration-300" style={{ height: '65vh' }}>
                <div className="flex justify-between items-start px-8 py-4 border-b border-neutral-700 flex-shrink-0">
                    <div>
                        {renderHeader()}
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors duration-200">
                        <span className="material-symbols-outlined text-4xl">close</span>
                    </button>
                </div>
                
                <div 
                    ref={sliderRef}
                    key={step} 
                    className="flex-grow overflow-x-auto no-scrollbar cursor-grab py-8 pl-8"
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onWheel={handleWheel}
                >
                    <div className="flex flex-row items-stretch gap-6 h-full">
                        {step === 'archetype' && sortedArchetypes.map(archetype => (
                            <div key={archetype.key} ref={el => { archetypeCardRefs.current[archetype.key] = el; }}>
                                <ArchetypeSelectionCard
                                    archetype={archetype}
                                    isSelected={selectedArchetypeKey === archetype.key}
                                    onClick={() => handleCardClick(() => handleSelectArchetype(archetype.key))}
                                    selectedSkinIndex={selectedArchetypeSkins[archetype.key] ?? 0}
                                    onSkinChange={(index) => handleSkinChange(archetype.key, index)}
                                />
                            </div>
                        ))}
                        {step === 'world' && sortedWorlds.map(world => (
                           <div key={world.key} ref={el => { worldCardRefs.current[world.key] = el; }}>
                               <WorldSelectionCard
                                   world={world}
                                   isSelected={selectedWorldKey === world.key}
                                   onClick={() => handleCardClick(() => handleSelectWorld(world.key))}
                               />
                           </div>
                       ))}
                       {/* Spacer element creates symmetrical padding on the right side. gap-6 (1.5rem) + w-2 (0.5rem) = 2rem, matching pl-8 */}
                       <div aria-hidden="true" className="w-2 flex-shrink-0" />
                    </div>
                </div>

                <div className="px-8 py-4 mt-auto border-t border-neutral-700 flex justify-between items-center flex-shrink-0">
                    {step === 'world' ? (
                        <button onClick={handleBack} className="text-neutral-400 hover:text-white font-semibold px-4 py-3 rounded-full transition">
                            Back
                        </button>
                    ) : (
                        <div /> // Placeholder to keep the "Continue" button on the right
                    )}
                    
                    {step === 'archetype' ? (
                         <ButtonBasic onClick={handleNext} disabled={!selectedArchetypeKey}>
                            Continue
                        </ButtonBasic>
                    ) : (
                         <ButtonBasic onClick={handleConfirm} disabled={!selectedWorldKey}>
                            Begin Conquest
                        </ButtonBasic>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GameStartDialog;
