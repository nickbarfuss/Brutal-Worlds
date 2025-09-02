
import * as THREE from 'three';
import { ActiveHighlight } from '../types/game';
import { useGameEngine } from '../hooks/useGameEngine';
import { VfxManager } from '../logic/VfxManager';
import { getScreenPosition } from './draw/drawUtils';
import { drawAllEnclaves, drawSelectionPulse } from './draw/drawEnclaves';
import { drawAllRoutes } from './draw/drawRoutes';
import { drawAllDisasterMarkers } from './draw/drawDisasters';
import { drawHighlightLabels } from './draw/drawHighlights';

export const drawUICanvas = (
    ctx: CanvasRenderingContext2D, 
    clockTime: number, 
    gameState: ReturnType<typeof useGameEngine>,
    vfxManager: VfxManager,
    camera: THREE.PerspectiveCamera,
    mapContainer: THREE.Object3D,
    activeHighlight: ActiveHighlight | null,
    globalAlpha: number
) => {
    const { enclaveData, routes, pendingOrders, selectedEnclaveId, mapData, hoveredCellId, currentWorld, activeDisasterMarkers } = gameState;

    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    if (globalAlpha <= 0 || !currentWorld) return;

    ctx.save();
    ctx.globalAlpha = globalAlpha;

    const sphereRadius = currentWorld.config.SPHERE_RADIUS;
    vfxManager.updateAndDraw(ctx, mapContainer, camera, sphereRadius);
    
    const enclaveScreenPositions: { [id: number]: { x: number; y: number; visible: boolean } } = {};
    Object.values(enclaveData).forEach(enclave => {
        enclaveScreenPositions[enclave.id] = getScreenPosition(enclave.center, mapContainer, camera, canvas);
    });

    const disasterMarkerScreenPositions: { [id: number]: { x: number; y: number; visible: boolean } } = {};
    activeDisasterMarkers.forEach((marker, i) => {
        disasterMarkerScreenPositions[i] = getScreenPosition(marker.position, mapContainer, camera, canvas);
    });

    drawAllRoutes(ctx, { routes, enclaveData, pendingOrders, enclaveScreenPositions, selectedEnclaveId, hoveredCellId, mapData, currentWorld, clockTime });

    drawHighlightLabels(ctx, { activeHighlight, gameState, mapContainer, camera, canvas });
    
    drawAllDisasterMarkers(ctx, { activeDisasterMarkers, disasterMarkerScreenPositions, clockTime });
    
    drawAllEnclaves(ctx, { enclaveData, enclaveScreenPositions, selectedEnclaveId, hoveredCellId, mapData, currentWorld, routes, activeHighlight, clockTime });

    // Draw selection pulse on top of everything else
    if (selectedEnclaveId !== null) {
        const pos = enclaveScreenPositions[selectedEnclaveId];
        if (pos && pos.visible) {
            drawSelectionPulse(ctx, pos, clockTime);
        }
    }
    
    ctx.restore();
};
