import { SFX_SOURCES, SfxCategoryName } from '../data/sfx';
import { getAssetUrl } from '../utils/assetUtils';
import { AudioChannel } from '../types/game';

type SfxCategory = { [key: string]: { url: string } };

export class SfxManager {
    private sounds: Map<string, HTMLAudioElement> = new Map();
    private loopingChannels: Map<AudioChannel, { key: string, element: HTMLAudioElement }> = new Map();
    private activeOneShots: Set<HTMLAudioElement> = new Set();
    private blockedLoops: Map<AudioChannel, { key: string, element: HTMLAudioElement }> = new Map();
    private blockedOneShots: Array<{ key: string; channel: AudioChannel; audio: HTMLAudioElement }> = [];
    private isAudioUnlocked = false;

    private musicTrackKeys: string[] = [];
    private currentMusicTrack: { element: HTMLAudioElement, listener: () => void } | null = null;
    private isMusicBlocked = false;

    private channelVolumes: Record<AudioChannel, number> = {
        fx: 0.7,
        ambient: 0.28,
        music: 0.6,
        ui: 0.6,
    };
    private mutedChannels: Record<AudioChannel, boolean> = {
        fx: false,
        ambient: false,
        music: false,
        ui: false,
    };
    private isInitialized = false;

    public async init(): Promise<void> {
        if (this.isInitialized) return;

        const assetPromises: Promise<void>[] = [];

        const loadCategory = (category: SfxCategory, prefix: SfxCategoryName) => {
            for (const [key, profile] of Object.entries(category)) {
                const fullKey = `${prefix}-${key}`;
                assetPromises.push(this.loadSound(fullKey, profile.url));
            }
        };

        (Object.keys(SFX_SOURCES) as SfxCategoryName[]).forEach(categoryName => {
            loadCategory(SFX_SOURCES[categoryName], categoryName);
            if (categoryName === 'music') {
                this.musicTrackKeys = Object.keys(SFX_SOURCES.music).map(key => `music-${key}`);
            }
        });
        
        try {
            await Promise.all(assetPromises);
            this.isInitialized = true;
            console.log("SFX Manager initialized successfully.");
        } catch (error) {
            console.error("A critical error occurred during SFX Manager initialization:", error);
        }
    }

    private loadSound(key: string, url: string): Promise<void> {
        return new Promise((resolve) => {
            const audio = new Audio(getAssetUrl(url));
            audio.preload = 'auto';
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn(`Sound loading timed out for "${key}". Continuing without it.`);
                    cleanup();
                    resolve(); // Resolve even on timeout
                }
            }, 5000); // 5-second timeout

            const onLoadedData = () => {
                if (!resolved) {
                    resolved = true;
                    this.sounds.set(key, audio);
                    cleanup();
                    resolve();
                }
            };

            const onError = () => {
                if (!resolved) {
                    resolved = true;
                    console.error(`Failed to load sound for "${key}" from ${getAssetUrl(url)}`);
                    cleanup();
                    resolve(); // Resolve even on error to not block the game
                }
            };
            
            const cleanup = () => {
                clearTimeout(timeout);
                audio.removeEventListener('loadeddata', onLoadedData);
                audio.removeEventListener('error', onError);
            };

            audio.addEventListener('loadeddata', onLoadedData);
            audio.addEventListener('error', onError);
            audio.load();
        });
    }

    public playSound(key: string, channel: AudioChannel = 'fx'): void {
        const originalAudio = this.sounds.get(key);
        if (originalAudio) {
            const newAudio = originalAudio.cloneNode(true) as HTMLAudioElement;
            const isMuted = this.mutedChannels[channel];
            newAudio.volume = isMuted ? 0 : this.channelVolumes[channel];
            
            if (!this.isAudioUnlocked) {
                this.blockedOneShots.push({ key, channel, audio: newAudio });
                return;
            }

            this.activeOneShots.add(newAudio);

            const onEnded = () => {
                newAudio.removeEventListener('ended', onEnded);
                this.activeOneShots.delete(newAudio);
            };
            newAudio.addEventListener('ended', onEnded);

            newAudio.play().catch(e => {
                if (e.name === 'AbortError') {
                    // This is a benign error when playback is interrupted by a pause() call.
                } else {
                    console.error(`Error playing sound ${key}:`, e);
                }
                this.activeOneShots.delete(newAudio);
                newAudio.removeEventListener('ended', onEnded);
            });
        } else {
            console.warn(`Sound key "${key}" not found or not preloaded.`);
        }
    }

    private playRandomMusicTrack = (): void => {
        if (this.musicTrackKeys.length === 0) return;
    
        if (this.currentMusicTrack) {
            this.currentMusicTrack.element.removeEventListener('ended', this.currentMusicTrack.listener);
        }

        const randomKey = this.musicTrackKeys[Math.floor(Math.random() * this.musicTrackKeys.length)];
        const originalAudio = this.sounds.get(randomKey);

        if (!originalAudio) {
            console.warn(`Music track "${randomKey}" not found.`);
            return;
        }

        const newAudio = originalAudio.cloneNode(true) as HTMLAudioElement;
        const isMuted = this.mutedChannels.music;
        newAudio.volume = isMuted ? 0 : this.channelVolumes.music;
        newAudio.loop = false;

        const onEnded = () => {
            this.playRandomMusicTrack();
        };
        newAudio.addEventListener('ended', onEnded);

        this.currentMusicTrack = { element: newAudio, listener: onEnded };

        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isAudioUnlocked = true;
                    this.isMusicBlocked = false;
                })
                .catch(error => {
                    if (error.name === 'NotAllowedError') {
                        this.isMusicBlocked = true;
                    } else {
                        console.error(`Error playing music ${randomKey}:`, error);
                    }
                });
        }
    }

    public playLoop(key: string, channel: AudioChannel): void {
        if (channel === 'music') {
            this.stopLoop(channel);
            this.playRandomMusicTrack();
            return;
        }

        this.stopLoop(channel);

        const originalAudio = this.sounds.get(key);
        if (!originalAudio) {
            console.warn(`Looping sound key "${key}" not found or not preloaded.`);
            return;
        }

        const newAudio = originalAudio.cloneNode(true) as HTMLAudioElement;
        const isMuted = this.mutedChannels[channel];
        newAudio.volume = isMuted ? 0 : this.channelVolumes[channel];
        newAudio.loop = true;

        const playPromise = newAudio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isAudioUnlocked = true;
                this.loopingChannels.set(channel, { key, element: newAudio });
                this.blockedLoops.delete(channel);
            }).catch(error => {
                if (error.name === 'NotAllowedError') {
                    this.blockedLoops.set(channel, { key, element: newAudio });
                } else {
                    console.error(`Error playing looping sound ${key}:`, error);
                }
            });
        }
    }
    
    public playLoopIfNotPlaying(key: string, channel: AudioChannel): void {
        if (channel === 'music') {
            if (!this.currentMusicTrack && !this.isMusicBlocked) {
                this.playLoop(key, channel);
            }
            return;
        }

        const currentLoop = this.loopingChannels.get(channel);
        if (currentLoop?.key === key && !currentLoop.element.paused) {
            return;
        }
        const blockedLoop = this.blockedLoops.get(channel);
        if (blockedLoop?.key === key) {
            return;
        }
        this.playLoop(key, channel);
    }

    public stopLoop(channel: AudioChannel): void {
        if (channel === 'music') {
            if (this.currentMusicTrack) {
                this.currentMusicTrack.element.pause();
                this.currentMusicTrack.element.removeEventListener('ended', this.currentMusicTrack.listener);
                this.currentMusicTrack.element.currentTime = 0;
                this.currentMusicTrack = null;
            }
            this.isMusicBlocked = false;
            this.loopingChannels.delete(channel); // Clean up just in case
            return;
        }

        const loop = this.loopingChannels.get(channel);
        if (loop) {
            loop.element.pause();
            loop.element.currentTime = 0;
            this.loopingChannels.delete(channel);
        }
        this.blockedLoops.delete(channel);
    }

    public handleUserInteraction(): void {
        if (this.isAudioUnlocked) return;
        this.isAudioUnlocked = true;

        if (this.isMusicBlocked && this.currentMusicTrack) {
            this.currentMusicTrack.element.play().then(() => {
                this.isMusicBlocked = false;
            }).catch(e => {
                console.error(`Still failed to play blocked music after interaction:`, e);
            });
        }

        this.blockedLoops.forEach((loop, channel) => {
            loop.element.play().then(() => {
                this.loopingChannels.set(channel, loop);
                this.blockedLoops.delete(channel);
            }).catch(e => {
                console.error(`Still failed to play blocked loop "${loop.key}" after interaction:`, e);
            });
        });

        this.blockedOneShots.forEach(({ key, channel, audio }) => {
            audio.volume = this.mutedChannels[channel] ? 0 : this.channelVolumes[channel];
            this.activeOneShots.add(audio);
            const onEnded = () => {
                audio.removeEventListener('ended', onEnded);
                this.activeOneShots.delete(audio);
            };
            audio.addEventListener('ended', onEnded);
            audio.play().catch(e => {
                 console.error(`Still failed to play blocked one-shot "${key}" after interaction:`, e);
                 this.activeOneShots.delete(audio);
                 audio.removeEventListener('ended', onEnded);
            });
        });
        this.blockedOneShots = [];
    }
    
    public setVolume(channel: AudioChannel, volume: number): void {
        this.channelVolumes[channel] = volume;

        if (!this.mutedChannels[channel]) {
            const loop = this.loopingChannels.get(channel);
            if (loop) {
                loop.element.volume = volume;
            }
            if (channel === 'music' && this.currentMusicTrack) {
                this.currentMusicTrack.element.volume = volume;
            }
        }
    }
    
    public setMuted(channel: AudioChannel, isMuted: boolean): void {
        this.mutedChannels[channel] = isMuted;
        const effectiveVolume = isMuted ? 0 : this.channelVolumes[channel];
        
        const loop = this.loopingChannels.get(channel);
        if (loop) {
            loop.element.volume = effectiveVolume;
        }
        if (channel === 'music' && this.currentMusicTrack) {
            this.currentMusicTrack.element.volume = effectiveVolume;
        }
    }

    public reset(): void {
        this.loopingChannels.forEach((_, channel) => {
            this.stopLoop(channel);
        });
        this.blockedLoops.clear();
        this.blockedOneShots = [];
        
        this.activeOneShots.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        this.activeOneShots.clear();
    }
}