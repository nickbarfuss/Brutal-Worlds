

import { Enclave, WorldProfile, ActiveHighlight, Owner } from '../../types/game';
import { useGameEngine } from '../../hooks/useGameEngine';
import { getPaletteForOwner } from './drawUtils';
import { getIconForEntityType } from '../../utils/entityUtils';

const canvasStyles = {
    enclaveMarker: { radius: 14 },
    disasterIcon: { radius: 12, iconFont: "16px 'Material Symbols Outlined'" },
    dynamicChip: { paddingOuterX: 4, paddingOuterY: 4, paddingInner: 6 },
    worldLabel: {
        iconSize: 16,
        iconFont: "16px 'Material Symbols Outlined'",
        textFont: "12px 'Open Sans'",
    }
};

export const drawSelectionPulse = (ctx: CanvasRenderingContext2D, pos: { x: number, y: number }, clockTime: number) => {
    const pulseDuration = 1.0;
    const timeInPulse = (clockTime * 0.8) % pulseDuration;
    const progress = timeInPulse / pulseDuration;
    
    ctx.save();
    for (let i = 0; i < 2; i++) {
        const rippleProgress = (progress + i * 0.5) % 1;
        const radius = rippleProgress * 30;
        const opacity = (1 - rippleProgress) * 0.7;

        if (opacity > 0) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(238, 242, 255, ${opacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    ctx.restore();
};

const drawEnclaveChip = (
    ctx: CanvasRenderingContext2D,
    enclave: Enclave,
    pos: { x: number; y: number },
    clockTime: number,
    worldProfile: WorldProfile | null,
    showLabel: boolean
) => {
    const effects = enclave.activeEffects || [];
    
    const chipStyle = canvasStyles.dynamicChip;
    const disasterIconStyle = canvasStyles.disasterIcon;
    const enclaveMarkerStyle = canvasStyles.enclaveMarker;
    const labelStyle = canvasStyles.worldLabel;

    const markerWidth = enclaveMarkerStyle.radius * 2;
    const rightPartWidth = effects.length > 0 ? (effects.length * disasterIconStyle.radius * 2) + (effects.length * chipStyle.paddingInner) : 0;
    
    let leftPartWidth = 0;
    if (showLabel) {
        ctx.font = labelStyle.textFont;
        const labelTextWidth = ctx.measureText(enclave.name).width;
        leftPartWidth = chipStyle.paddingInner + labelStyle.iconSize + chipStyle.paddingInner + labelTextWidth + chipStyle.paddingInner + 8;
    }

    const totalContentWidth = leftPartWidth + markerWidth + rightPartWidth;
    const chipWidth = totalContentWidth + (chipStyle.paddingOuterX * 2);
    const chipHeight = enclaveMarkerStyle.radius * 2 + (chipStyle.paddingOuterY * 2);

    const chipX = pos.x - (enclaveMarkerStyle.radius + leftPartWidth + chipStyle.paddingOuterX);
    const chipY = pos.y - enclaveMarkerStyle.radius - chipStyle.paddingOuterY;

    const palette = getPaletteForOwner(enclave.owner, worldProfile);
    const chipBgColor = palette.dark;
    const markerColor = palette.base;
    const forceTextColor = palette.light;
    const labelIconColor = palette.icon;
    const labelTextColor = palette.text;

    ctx.save();
    ctx.fillStyle = chipBgColor;
    ctx.beginPath();
    (ctx as any).roundRect(chipX, chipY, chipWidth, chipHeight, chipHeight / 2);
    ctx.fill();

    let currentX = chipX + chipStyle.paddingOuterX;
    if (showLabel) {
        currentX += chipStyle.paddingInner;
        ctx.font = labelStyle.iconFont; ctx.fillStyle = labelIconColor;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(getIconForEntityType('enclave'), currentX + labelStyle.iconSize / 2, pos.y);
        currentX += labelStyle.iconSize + chipStyle.paddingInner;
        ctx.font = labelStyle.textFont; ctx.fillStyle = labelTextColor;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(enclave.name, currentX, pos.y);
    }

    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, enclaveMarkerStyle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "700 14px 'Open Sans'"; ctx.fillStyle = forceTextColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    
    // FIX: Sanitize the force count before drawing it to prevent a NaN value
    // from being passed to `fillText`, which could crash the canvas renderer.
    const safeForces = Number.isFinite(enclave.forces) ? Math.round(enclave.forces) : 0;
    ctx.fillText(String(safeForces), pos.x, pos.y + 1);

    let disasterCurrentX = pos.x + enclaveMarkerStyle.radius + chipStyle.paddingInner + disasterIconStyle.radius;
    effects.forEach(effect => {
        if (effect.phase === 'alert') {
            const pulse = (Math.sin(clockTime * Math.PI * 4) + 1) / 2;
            ctx.globalAlpha = 0.5 + pulse * 0.5;
        }
        ctx.font = disasterIconStyle.iconFont; ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(effect.icon, disasterCurrentX, pos.y);
        ctx.globalAlpha = 1.0;
        disasterCurrentX += (disasterIconStyle.radius * 2) + chipStyle.paddingInner;
    });
    ctx.restore();
};

const drawEnclaveMarker = (
    ctx: CanvasRenderingContext2D,
    enclave: Enclave,
    pos: { x: number; y: number },
    isHovered: boolean,
    isCommandMode: boolean,
    worldProfile: WorldProfile | null,
    routes: ReturnType<typeof useGameEngine>['routes'],
    selectedEnclaveId: number | null
) => {
    const palette = getPaletteForOwner(enclave.owner, worldProfile);
    const ownerColor = palette.base;
    const forceTextColor = palette.light;

    let markerColor = ownerColor;
    if (isCommandMode) {
        const isConnected = routes.some(r => (r.from === selectedEnclaveId && r.to === enclave.id) || (r.to === selectedEnclaveId && r.from === enclave.id));
        if (enclave.id !== selectedEnclaveId && !isConnected) { /* Do nothing */ }
    } else if (isHovered) {
        markerColor = palette.hover;
    }

    ctx.fillStyle = markerColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "700 14px 'Open Sans'";
    ctx.fillStyle = forceTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // FIX: Sanitize the force count before drawing it to prevent a NaN value
    // from being passed to `fillText`, which could crash the canvas renderer.
    const safeForces = Number.isFinite(enclave.forces) ? Math.round(enclave.forces) : 0;
    ctx.fillText(String(safeForces), pos.x, pos.y + 1);
};

interface DrawAllEnclavesProps {
    enclaveData: { [id: number]: Enclave };
    enclaveScreenPositions: { [id: number]: { x: number; y: number; visible: boolean } };
    selectedEnclaveId: number | null;
    hoveredCellId: number;
    mapData: ReturnType<typeof useGameEngine>['mapData'];
    currentWorld: WorldProfile | null;
    routes: ReturnType<typeof useGameEngine>['routes'];
    activeHighlight: ActiveHighlight | null;
    clockTime: number;
}

export const drawAllEnclaves = (ctx: CanvasRenderingContext2D, props: DrawAllEnclavesProps) => {
    const { enclaveData, enclaveScreenPositions, selectedEnclaveId, hoveredCellId, mapData, currentWorld, routes, activeHighlight, clockTime } = props;
    
    Object.values(enclaveData).forEach(enclave => {
        const pos = enclaveScreenPositions[enclave.id];
        if (!pos || !pos.visible) return;

        const shouldDrawLabel = activeHighlight?.type === 'enclaves' && activeHighlight.owners.has(enclave.owner);
        
        if (enclave.activeEffects.length > 0 || shouldDrawLabel) {
            drawEnclaveChip(ctx, enclave, pos, clockTime, currentWorld, shouldDrawLabel);
        } else {
             const localHoveredEnclaveId = mapData[hoveredCellId]?.enclaveId ?? -1;
             const isHovered = enclave.id === localHoveredEnclaveId;
             const isCommandMode = selectedEnclaveId !== null;
             drawEnclaveMarker(ctx, enclave, pos, isHovered, isCommandMode, currentWorld, routes, selectedEnclaveId);
        }
    });
};