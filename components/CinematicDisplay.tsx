
import React from 'react';
import { IntroStep } from '../types/game';

interface CinematicDisplayProps {
  introStep: IntroStep;
  planetName: string;
  worldColor: string;
}

const CinematicDisplay: React.FC<CinematicDisplayProps> = ({ introStep, planetName, worldColor }) => {
  if (introStep === 'none') {
    return null;
  }

  const isLetterboxVisible = introStep === 'warp' || introStep === 'zoom';
  const isLetterboxRevealing = introStep === 'reveal';

  let letterboxUpClass = '';
  if (introStep === 'warp') letterboxUpClass = 'animate-letterbox-slide-in-top';
  else if (isLetterboxRevealing) letterboxUpClass = 'animate-letterbox-reveal-up-delayed';

  let letterboxDownClass = '';
  if (introStep === 'warp') letterboxDownClass = 'animate-letterbox-slide-in-bottom';
  else if (isLetterboxRevealing) letterboxDownClass = 'animate-letterbox-reveal-down-delayed';
  
  const isTitleVisible = introStep === 'warp' || introStep === 'zoom' || introStep === 'reveal';

  let titleAnimationClass = '';
  // The key prop on the outer div ensures the component re-mounts when the step changes,
  // which is a robust way to re-trigger CSS animations.
  if (introStep === 'warp') {
    titleAnimationClass = 'animate-intro-title-fade-in opacity-0';
  } else if (introStep === 'reveal') {
    titleAnimationClass = 'animate-intro-title-fade-out';
  }

  return (
    <div className="pointer-events-none" key={introStep}>
      {(isLetterboxVisible || isLetterboxRevealing) && (
        <>
          <div
            className={`fixed top-0 left-0 right-0 h-[15vh] bg-black z-50 ${letterboxUpClass}`}
            style={{ transform: (introStep === 'zoom') ? 'translateY(0)' : undefined }}
          />
          <div
            className={`fixed bottom-0 left-0 right-0 h-[15vh] bg-black z-50 ${letterboxDownClass}`}
             style={{ transform: (introStep === 'zoom') ? 'translateY(0)' : undefined }}
          />
        </>
      )}

      {isTitleVisible && (
          <div 
            className={`fixed inset-0 z-50 flex flex-col items-center justify-center text-center ${titleAnimationClass}`}
          >
            <div className="p-12">
              <h1
                  className="font-dungeon text-5xl font-bold text-white uppercase tracking-wider"
                  style={{ textShadow: '4px 4px 16px rgba(0,0,0,0.1)' }}
              >
                  {planetName}
              </h1>
            </div>
          </div>
      )}
    </div>
  );
};

export default CinematicDisplay;