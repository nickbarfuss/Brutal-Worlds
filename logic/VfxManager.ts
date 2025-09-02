import * as THREE from 'three';
import { VfxProfile, ActiveVfx, DisasterProfile, OrderProfile } from '../types/game';
import { getAssetUrl } from '../utils/assetUtils';

interface VfxProfileSources {
    disasters: { [key: string]: DisasterProfile };
    orders: { [key: string]: OrderProfile };
    general: { [key: string]: VfxProfile };
}

export class VfxManager {
    private spriteSheets: { [key: string]: VfxProfile & { image: HTMLImageElement } } = {};
    private activeEffects: ActiveVfx[] = [];
    private isInitialized = false;

    public async init(sources: VfxProfileSources): Promise<void> {
        if (this.isInitialized) return;

        const assetPromises: Promise<void>[] = [];
        
        // Load general VFX
        for (const [key, profile] of Object.entries(sources.general)) {
            assetPromises.push(this.loadSpriteSheet(key, profile));
        }

        // Load order VFX
        for (const [key, profile] of Object.entries(sources.orders)) {
            if (profile.vfx) {
                assetPromises.push(this.loadSpriteSheet(`order-${key}`, profile.vfx));
            }
        }

        // Load disaster VFX from disaster profiles
        for (const [disasterKey, disasterProfile] of Object.entries(sources.disasters)) {
            if (disasterProfile.logic.alert?.vfx) {
                assetPromises.push(this.loadSpriteSheet(`${disasterKey}-alert`, disasterProfile.logic.alert.vfx));
            }
            if (disasterProfile.logic.impact?.vfx) {
                assetPromises.push(this.loadSpriteSheet(`${disasterKey}-impact`, disasterProfile.logic.impact.vfx));
            }
            if (disasterProfile.logic.aftermath?.vfx) {
                assetPromises.push(this.loadSpriteSheet(`${disasterKey}-aftermath`, disasterProfile.logic.aftermath.vfx));
            }
        }

        try {
            await Promise.all(assetPromises);
            this.isInitialized = true;
            console.log("VFX Manager initialized successfully.");
        } catch (error) {
            console.error("Error initializing VFX Manager:", error);
            throw new Error("Failed to load one or more VFX assets.");
        }
    }

    private loadSpriteSheet(key: string, profile: VfxProfile): Promise<void> {
        return new Promise((resolve) => {
            const assetUrl = profile.url;
            if (!assetUrl) {
                console.error(`URL for key "${key}" not found.`);
                return resolve();
            }
            
            const sprite = new Image();
            let resolved = false;

            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn(`VFX loading timed out for "${key}". Continuing without it.`);
                    cleanup();
                    resolve();
                }
            }, 8000); // 8-second timeout

            const onLoaded = () => {
                if (!resolved) {
                    resolved = true;
                    // FIX: This is a critical defensive check to prevent a division-by-zero
                    // error if a VFX profile has a frameHeight of 0. Such an error would
                    // result in `totalFrames` being Infinity, crashing the animation loop.
                    const frameHeight = profile.frameHeight;
                    let calculatedFrames = 0;
                    if (frameHeight && isFinite(frameHeight) && frameHeight > 0 && sprite.height > 0) {
                        calculatedFrames = profile.columns * Math.floor(sprite.height / frameHeight);
                    }
                    const totalFrames = profile.totalFrames || calculatedFrames;

                    this.spriteSheets[key] = {
                        ...profile,
                        image: sprite,
                        totalFrames,
                    };
                    cleanup();
                    resolve();
                }
            };

            const onError = () => {
                if (!resolved) {
                    resolved = true;
                    console.error(`Failed to load sprite sheet for "${key}" from ${getAssetUrl(assetUrl)}`);
                    cleanup();
                    resolve(); // Resolve even on error to not block the game
                }
            };

            const cleanup = () => {
                clearTimeout(timeout);
                sprite.removeEventListener('load', onLoaded);
                sprite.removeEventListener('error', onError);
            };

            sprite.addEventListener('load', onLoaded);
            sprite.addEventListener('error', onError);
            sprite.src = getAssetUrl(assetUrl);
        });
    }
    
    public reset(): void {
        this.activeEffects = [];
    }

    public playEffect(key: string, worldPosition: THREE.Vector3): void {
        const sheet = this.spriteSheets[key];
        if (!sheet) {
            console.warn(`VFX key "${key}" not found or not preloaded.`);
            return;
        }
        
        this.activeEffects.push({
            key,
            sheet,
            worldPosition: worldPosition.clone(),
            currentFrame: 0,
            lastFrameTime: performance.now(),
        });
    }

    public updateAndDraw(
        ctx: CanvasRenderingContext2D, 
        mapContainer: THREE.Object3D, 
        camera: THREE.PerspectiveCamera, 
        sphereRadius: number
    ): void {
        if (!this.isInitialized) return;

        const now = performance.now();
        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = ctx.canvas.width / dpr;
        const canvasHeight = ctx.canvas.height / dpr;

        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            const sheet = effect.sheet;
            const worldPos = effect.worldPosition.clone().applyMatrix4(mapContainer.matrixWorld);
            
            // More robust culling: check if the surface normal is facing the camera.
            const viewVector = new THREE.Vector3().subVectors(camera.position, worldPos);
            const normal = worldPos.clone().normalize(); // Assumes sphere is at origin

            if (viewVector.dot(normal) > 0) { // If the point is on the visible hemisphere
                const frameDuration = 1000 / sheet.frameRate;
                if (now - effect.lastFrameTime > frameDuration) {
                    effect.currentFrame++;
                    effect.lastFrameTime = now;
                }

                if (effect.currentFrame >= (sheet.totalFrames ?? 0)) {
                    this.activeEffects.splice(i, 1);
                    continue;
                }
                
                const screenPos = worldPos.clone().project(camera);
                
                // Check if the effect is within the screen bounds (in front of camera)
                if (screenPos.z < 1) {
                    const col = effect.currentFrame % sheet.columns;
                    const row = Math.floor(effect.currentFrame / sheet.columns);
                    const sx = col * sheet.frameWidth;
                    const sy = row * sheet.frameHeight;
                    const x = (screenPos.x * 0.5 + 0.5) * canvasWidth;
                    const y = (-screenPos.y * 0.5 + 0.5) * canvasHeight;

                    ctx.drawImage(
                        sheet.image, sx, sy, sheet.frameWidth, sheet.frameHeight,
                        x - sheet.frameWidth / 2, y - sheet.frameHeight / 2,
                        sheet.frameWidth, sheet.frameHeight
                    );
                }
            }
        }
    }
}