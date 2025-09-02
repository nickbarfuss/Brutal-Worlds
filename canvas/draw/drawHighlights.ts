
import * as THREE from 'three';
import { ActiveHighlight, Owner, WorldProfile } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import { getPaletteForOwner, getScreenPosition } from './drawUtils';
import { getIconForEntityType } from '../../utils/entityUtils';

const canvasStyles = {
    enclaveMarker: { radius: 14 },
    dynamicChip: { paddingOuterX: 4, paddingOuterY: 4, paddingInner: 6 },
    worldLabel: {
        iconSize: 16,
        iconFont: "16px 'Material Symbols Outlined'",
        textFont: "12px 'Open Sans'",
    }
};

const drawDynamicLabelChip = (
    ctx: CanvasRenderingContext2D,
    pos: { x: number; y: number },
    icon: string,
    text: string,
    worldProfile: WorldProfile | null,
    owner: Owner,
) => {
    const chipStyle = canvasStyles.dynamicChip;
    const markerStyle = canvasStyles.enclaveMarker;
    const labelStyle = canvasStyles.worldLabel;

    ctx.font = labelStyle.textFont;
    const labelTextWidth = ctx.measureText(text).width;
    const leftPartWidth = chipStyle.paddingInner + labelStyle.iconSize + chipStyle.paddingInner + labelTextWidth + chipStyle.paddingInner + 8;
    
    const markerWidth = markerStyle.radius * 2;
    const totalContentWidth = leftPartWidth + markerWidth;
    const chipWidth = totalContentWidth + (chipStyle.paddingOuterX * 2);
    const chipHeight = markerStyle.radius * 2 + (chipStyle.paddingOuterY * 2);

    const chipX = pos.x - (markerStyle.radius + leftPartWidth + chipStyle.paddingOuterX);
    const chipY = pos.y - markerStyle.radius - chipStyle.paddingOuterY;
    
    const palette = getPaletteForOwner(owner, worldProfile);
    const labelIconColor = palette.icon;
    const labelTextColor = palette.text;
    const markerColor = palette.base;

    ctx.save();
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    (ctx as any).roundRect(chipX, chipY, chipWidth, chipHeight, chipHeight / 2);
    ctx.fill();

    let currentX = chipX + chipStyle.paddingOuterX + chipStyle.paddingInner;
    ctx.font = labelStyle.iconFont;
    ctx.fillStyle = labelIconColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, currentX + labelStyle.iconSize / 2, pos.y);
    currentX += labelStyle.iconSize + chipStyle.paddingInner;

    ctx.font = labelStyle.textFont;
    ctx.fillStyle = labelTextColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, currentX, pos.y);

    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, markerStyle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

interface DrawHighlightLabelsProps {
    activeHighlight: ActiveHighlight | null;
    gameState: ReturnType<typeof useGameEngine>;
    mapContainer: THREE.Object3D;
    camera: THREE.PerspectiveCamera;
    canvas: HTMLCanvasElement;
}

export const drawHighlightLabels = (ctx: CanvasRenderingContext2D, props: DrawHighlightLabelsProps) => {
    const { activeHighlight, gameState, mapContainer, camera, canvas } = props;
    const { domainData, expanseData, riftData, enclaveData, currentWorld } = gameState;

    if (!activeHighlight || !currentWorld) return;

    const getDomainOwner = (domainId: number): Owner => {
        const enclavesInDomain = Object.values(enclaveData).filter(e => e.domainId === domainId);
        if (enclavesInDomain.length === 0) return null;
        const firstOwner = enclavesInDomain[0].owner;
        return enclavesInDomain.every(e => e.owner === firstOwner) ? firstOwner : null;
    };

    if (activeHighlight.type === 'domains') {
        Object.values(domainData).forEach(domain => {
            const owner = getDomainOwner(domain.id);
            if (activeHighlight.owners.has(owner)) {
                const pos = getScreenPosition(domain.center, mapContainer, camera, canvas);
                if (pos.visible) {
                    drawDynamicLabelChip(ctx, pos, getIconForEntityType('domain'), domain.name, currentWorld, owner);
                }
            }
        });
    } else if (activeHighlight.type === 'expanses') {
        if (activeHighlight.owners.has(null)) {
            Object.values(expanseData).forEach(expanse => {
                const pos = getScreenPosition(expanse.center, mapContainer, camera, canvas);
                if (pos.visible) {
                    drawDynamicLabelChip(ctx, pos, getIconForEntityType('expanse'), expanse.name, currentWorld, null);
                }
            });
        }
    } else if (activeHighlight.type === 'rifts') {
        if (activeHighlight.owners.has(null)) {
            Object.values(riftData).forEach(rift => {
                const pos = getScreenPosition(rift.center, mapContainer, camera, canvas);
                if (pos.visible) {
                    drawDynamicLabelChip(ctx, pos, getIconForEntityType('rift'), rift.name, currentWorld, null);
                }
            });
        }
    }
};
