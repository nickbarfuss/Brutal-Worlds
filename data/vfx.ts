
import { VfxProfile } from '../types/game';

export const VFX_PROFILES: { [key: string]: VfxProfile } = {
    'conquest-player': { url: 'https://storage.googleapis.com/brutal-worlds/vfx/conquest-player.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 },
    'conquest-opponent': { url: 'https://storage.googleapis.com/brutal-worlds/vfx/conquest-opponent.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 },
};
