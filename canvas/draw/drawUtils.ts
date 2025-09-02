
import * as THREE from 'three';
import { Owner, WorldProfile, SemanticColorPalette } from '../../types/game';
import { PLAYER_THREE_COLORS } from '../../data/theme';

export const getPaletteForOwner = (owner: Owner, worldProfile: WorldProfile | null): SemanticColorPalette => {
    if (owner === 'player-1') return PLAYER_THREE_COLORS['player-1'];
    if (owner === 'player-2') return PLAYER_THREE_COLORS['player-2'];
    if (worldProfile) return worldProfile.neutralColorPalette;
    // Fallback default
    return {
        base: '#737373', hover: '#a3a3a3', target: '#d4d4d4', selected: '#d4d4d4',
        light: '#fafafa', dark: '#262626', disabled: '#404040', icon: '#d4d4d4', text: '#d4d4d4'
    };
};

export const getScreenPosition = (
    worldPosition: THREE.Vector3,
    mapContainer: THREE.Object3D,
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement
) => {
    const dpr = window.devicePixelRatio || 1;
    const pos = worldPosition.clone().applyMatrix4(mapContainer.matrixWorld);

    const viewVector = new THREE.Vector3().subVectors(camera.position, pos);
    const normal = pos.clone().normalize();

    if (viewVector.dot(normal) > 0) {
        const screenPos = pos.clone().project(camera);
        if (screenPos.z < 1) {
            return {
                x: (screenPos.x * 0.5 + 0.5) * canvas.width / dpr,
                y: (-screenPos.y * 0.5 + 0.5) * canvas.height / dpr,
                visible: true,
            };
        }
    }
    return { x: 0, y: 0, visible: false };
};
