import React, { useRef, useEffect } from 'react';
import { ArchetypeProfile } from '../types/profiles';
import Avatar from './ui/Avatar';
import ChipCard from './ui/ChipCard';
import { BIRTHRIGHTS } from '../data/birthrights';
import { GAMBITS } from '../data/gambits';
import Chip from './ui/Chip';
import { getAssetUrl } from '../utils/assetUtils';
import Card from './ui/Card';

interface ArchetypeSelectionCardProps {
  archetype: ArchetypeProfile;
  isSelected: boolean;
  onClick: () => void;
  selectedSkinIndex: number;
  onSkinChange: (index: number) => void;
}

const ArchetypeSelectionCard: React.FC<ArchetypeSelectionCardProps> = ({ archetype, isSelected, onClick, selectedSkinIndex, onSkinChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const birthright = BIRTHRIGHTS[archetype.birthrightKey];
  const selectedSkin = archetype.skins?.[selectedSkinIndex] || { videoUrl: '', imageUrl: '' };
  
  // This effect handles the video playback state based on whether the card is selected.
  useEffect(() => {
    if (videoRef.current) {
      if (isSelected) {
        videoRef.current.play().catch(() => {});
      } else {
        // FIX: Corrected a typo from `video.current` to `videoRef.current`.
        // This was causing an "Uncaught ReferenceError" when deselecting an archetype.
        videoRef.current.pause();
      }
    }
  }, [isSelected, selectedSkin]);

  const handleMouseEnter = async () => {
    // Only play video on hover if the card is NOT selected.
    if (!isSelected && videoRef.current) {
      try {
        await videoRef.current.play();
      } catch (error) {
        // Play() can be interrupted by pause(), which is normal and can be ignored.
      }
    }
  };

  const handleMouseLeave = () => {
    // Only pause video on leave if the card is NOT selected.
    if (!isSelected && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const mediaClasses = `absolute inset-0 w-full h-full object-cover transition-all duration-500 filter ${isSelected ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'}`;
  const borderAndShadowClasses = isSelected 
    ? 'border-[var(--color-accent-500)] shadow-lg shadow-color-[var(--color-accent-500)]/20 w-[48rem]' 
    : 'border-neutral-700/50 hover:border-[var(--color-accent-500)]/50 hover:shadow-lg hover:shadow-color-[var(--color-accent-500)]/10 w-96';

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      className={`relative group flex h-full flex-shrink-0 bg-neutral-900 rounded-xl border-2 shadow-lg overflow-hidden transition-all duration-500 ease-in-out ${borderAndShadowClasses}`}
    >
      {/* --- LEFT PANEL (Visible by default) --- */}
      <div className="relative w-96 h-full flex-shrink-0">
          {/* Video: Serves as the primary background. The poster is removed to prevent resizing flicker. */}
          {selectedSkin.videoUrl && (
            <video
              ref={videoRef}
              key={selectedSkin.videoUrl}
              loop
              muted
              playsInline
              className={mediaClasses}
              aria-hidden="true"
            >
              <source src={getAssetUrl(selectedSkin.videoUrl)} type="video/webm" />
            </video>
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
           <div className="relative w-full h-full p-6 flex flex-col justify-end items-center text-center pb-10">
              {/* --- Skin Switcher --- */}
              {archetype.skins && archetype.skins.length > 1 && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-2 z-10">
                  {archetype.skins.map((skin, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card's main onClick
                        onSkinChange(index);
                      }}
                      className={`h-1 w-6 rounded-full bg-neutral-50 transition-opacity duration-200 ${
                        selectedSkinIndex === index ? 'opacity-100' : 'opacity-50 hover:opacity-75'
                      }`}
                      aria-label={`Select skin ${index + 1}`}
                    />
                  ))}
                </div>
              )}
              <Avatar
                icon={archetype.icon}
                sizeClass="w-14 h-14"
                iconSizeClass="text-3xl"
                bgColorClass="bg-[var(--color-accent-800)]"
                iconColorClass="text-[var(--color-accent-400)]"
                className="mb-4"
              />
              <h3 className="text-3xl font-bold text-white mb-2">{archetype.name}</h3>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {archetype.focus.map(f => (
                  <Chip
                    key={f}
                    value={f}
                    bgColorClass="bg-[var(--color-accent-800)]"
                    valueColorClass="text-[var(--color-accent-300)] font-medium"
                  />
                ))}
              </div>
          </div>
      </div>
      
      {/* --- RIGHT PANEL (Revealed on select) --- */}
      <div 
        className="w-96 flex-shrink-0 bg-neutral-900/95 backdrop-blur-sm overflow-y-auto no-scrollbar text-left flex flex-col"
        onWheel={(e) => e.stopPropagation()}
      >
          <Card.Section title="Description">
            <p className="text-base text-gray-300">{archetype.description}</p>
          </Card.Section>

          {birthright && (
            <Card.Section title="Birthright">
                <ChipCard 
                    icon={birthright.icon}
                    iconColorClass="text-[var(--color-accent-400)]"
                    title={birthright.name}
                    subtitle={birthright.description}
                />
            </Card.Section>
          )}

          <Card.Section title="Gambits">
              <div className="space-y-2">
                {archetype.gambitKeys.map(gambitKey => {
                    const gambit = GAMBITS[gambitKey];
                    if (!gambit) return null;
                    return (
                        <ChipCard 
                            key={gambit.key}
                            icon={gambit.icon}
                            iconColorClass="text-[var(--color-accent-400)]"
                            title={gambit.name}
                            subtitle={gambit.description}
                        />
                    );
                })}
              </div>
          </Card.Section>
      </div>

    </div>
  );
};

export default ArchetypeSelectionCard;
