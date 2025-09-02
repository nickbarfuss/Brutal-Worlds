
import React, { useState, useEffect } from 'react';
import ButtonBasic from './ui/ButtonBasic';
import { WORLD_LIBRARY } from '../data/worlds';
import { getAssetUrl } from '../utils/assetUtils';
import ProductInfo from './ProductInfo';

interface MainScreenProps {
  onBegin: () => void;
  onInteraction: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ onBegin, onInteraction }) => {
    const [backgroundUrl, setBackgroundUrl] = useState<string>('');

    useEffect(() => {
        const randomWorld = WORLD_LIBRARY[Math.floor(Math.random() * WORLD_LIBRARY.length)];
        if (randomWorld) {
            setBackgroundUrl(randomWorld.illustrationUrl);
        }
    }, []);

    return (
        <div className="w-full h-full bg-neutral-900 relative" onClick={onInteraction}>
            {backgroundUrl && (
              <div
                  className="absolute inset-0 bg-cover bg-center animate-fade-in-slow"
                  style={{ backgroundImage: `url('${getAssetUrl(backgroundUrl)}')` }}
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <ProductInfo className="animate-fade-in-title" />
                <div className="mt-8 animate-fade-in-title-delayed pointer-events-auto">
                    <ButtonBasic onClick={onBegin}>
                        Begin
                    </ButtonBasic>
                </div>
            </div>
        </div>
    );
};

export default MainScreen;