
import * as THREE from 'three';
// Fix: Import SemanticColorPalette directly from the types definition file.
import { Route, PendingOrders, Enclave, Owner, WorldProfile, SemanticColorPalette } from '../../types/game';
import { getIconForRouteStatus } from '../../utils/entityUtils';
import { getPaletteForOwner } from './drawUtils';
import { PLAYER_THREE_COLORS } from '../../data/theme';

const drawRouteMarker = (ctx: CanvasRenderingContext2D, type: string, pos: {x: number, y: number}, clockTime: number, palette: SemanticColorPalette | null) => {
    ctx.save();
    const style = { radius: 12, iconFont: "16px 'Material Symbols Outlined'" };
    let icon: string | null = null, bgColor: string | null = null, iconColor: string | null = null;
    
    if (type === 'contested-attack') {
        icon = 'warning';
        const pulseState = Math.floor(clockTime * 2.5) % 2;
        bgColor = pulseState === 0 ? PLAYER_THREE_COLORS['player-1'].selected : PLAYER_THREE_COLORS['player-2'].selected;
        iconColor = pulseState === 0 ? PLAYER_THREE_COLORS['player-1'].light : PLAYER_THREE_COLORS['player-2'].light;
    } else if (type === 'contested-assist') {
        icon = 'add_circle';
        bgColor = PLAYER_THREE_COLORS['player-1'].selected;
        iconColor = PLAYER_THREE_COLORS['player-1'].light;
    } else if (type === 'disabled') {
        icon = getIconForRouteStatus('disabled');
        bgColor = '#27272a'; // neutral-800
        iconColor = '#f59e0b'; // amber-400 (semantic warning)
    } else if (type === 'destroyed') {
        icon = getIconForRouteStatus('destroyed');
        bgColor = '#27272a'; // neutral-800
        iconColor = '#ef4444'; // red-500 (semantic danger)
    }

    if (icon && bgColor && iconColor) {
       ctx.fillStyle = bgColor;
       ctx.beginPath();
       ctx.arc(pos.x, pos.y, style.radius, 0, Math.PI * 2);
       ctx.fill();

       ctx.font = style.iconFont;
       ctx.fillStyle = iconColor;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillText(icon, pos.x, pos.y);
    }
    
    ctx.restore();
};

interface DrawAllRoutesProps {
    routes: Route[];
    enclaveData: { [id: number]: Enclave };
    pendingOrders: PendingOrders;
    enclaveScreenPositions: { [id: number]: { x: number; y: number; visible: boolean } };
    selectedEnclaveId: number | null;
    hoveredCellId: number;
    mapData: any[]; // Simplified to avoid direct dependency on useGameEngine
    currentWorld: WorldProfile | null;
    clockTime: number;
}

export const drawAllRoutes = (ctx: CanvasRenderingContext2D, props: DrawAllRoutesProps) => {
    const { routes, enclaveData, pendingOrders, enclaveScreenPositions, selectedEnclaveId, hoveredCellId, mapData, currentWorld, clockTime } = props;

    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    const localHoveredEnclaveId = mapData[hoveredCellId]?.enclaveId ?? -1;
    const isCommandMode = selectedEnclaveId !== null;
    const hoveredTargetId = isCommandMode ? localHoveredEnclaveId : -1;

    routes.forEach(route => {
        const startPos = enclaveScreenPositions[route.from];
        const endPos = enclaveScreenPositions[route.to];
        if (!startPos || !endPos || !startPos.visible || !endPos.visible) return;

        const orderFwd = pendingOrders[route.from];
        const orderBwd = pendingOrders[route.to];
        const isContested = orderFwd && orderFwd.to === route.to && orderBwd && orderBwd.to === route.from && orderFwd.type === orderBwd.type;

        const { x: x1, y: y1 } = startPos;
        const { x: x2, y: y2 } = endPos;
        const dx = x2 - x1, dy = y2 - y1, dist = Math.hypot(dx, dy);
        if (dist === 0) return;

        const midX = x1 + dx / 2, midY = y1 + dy / 2;
        const screenCenterX = canvas.width / dpr / 2, screenCenterY = canvas.height / dpr / 2;
        const vecX = midX - screenCenterX, vecY = midY - screenCenterY;
        const vecLen = Math.hypot(vecX, vecY) || 1;
        const controlX = midX + (vecX / vecLen) * dist * 0.6, controlY = midY + (vecY / vecLen) * dist * 0.6;

        if (isContested) {
            const P0 = {x: x1, y: y1}, P1 = {x: controlX, y: controlY}, P2 = {x: x2, y: y2};
            const M = { x: (P0.x + 2*P1.x + P2.x)/4, y: (P0.y + 2*P1.y + P2.y)/4 };
            const C0 = { x: (P0.x + P1.x)/2, y: (P0.y + P1.y)/2 }, C1 = { x: (P1.x + P2.x)/2, y: (P1.y + P2.y)/2 };
            const animOffset = (clockTime * 15) % 20;

            const owner1 = enclaveData[route.from]?.owner ?? null, p1Palette = getPaletteForOwner(owner1, currentWorld);
            ctx.save();
            ctx.strokeStyle = p1Palette.target; ctx.lineWidth = 4; ctx.setLineDash([8, 12]);
            ctx.lineCap = 'round'; ctx.lineDashOffset = -animOffset;
            ctx.beginPath(); ctx.moveTo(P0.x, P0.y); ctx.quadraticCurveTo(C0.x, C0.y, M.x, M.y); ctx.stroke();
            ctx.restore();
            
            const owner2 = enclaveData[route.to]?.owner ?? null, p2Palette = getPaletteForOwner(owner2, currentWorld);
            ctx.save();
            ctx.strokeStyle = p2Palette.target; ctx.lineWidth = 4; ctx.setLineDash([8, 12]);
            ctx.lineCap = 'round'; ctx.lineDashOffset = -animOffset;
            ctx.beginPath(); ctx.moveTo(P2.x, P2.y); ctx.quadraticCurveTo(C1.x, C1.y, M.x, M.y); ctx.stroke();
            ctx.restore();
            
            if (currentWorld) drawRouteMarker(ctx, `contested-${orderFwd.type}`, M, clockTime, currentWorld.neutralColorPalette);
            return;
        }
        
        const orderOnRoute = (() => {
            if (orderFwd && orderFwd.to === route.to) return { ...orderFwd, from: route.from, direction: 1 };
            if (orderBwd && orderBwd.to === route.from) return { ...orderBwd, from: route.to, direction: -1 };
            return null;
        })();

        let style = { visible: false, color: '#ffffff', lineWidth: 1, opacity: 1.0, dash: [] as number[], animationSpeed: 0, animationDirection: 1 };
        const isRouteDisabled = route.isDestroyed || route.disabledForTurns > 0;
        const isConnectedToSelected = selectedEnclaveId !== null && (route.from === selectedEnclaveId || route.to === selectedEnclaveId);
        const isConnectedToHovered = selectedEnclaveId === null && localHoveredEnclaveId !== -1 && (route.from === localHoveredEnclaveId || route.to === localHoveredEnclaveId);

        if (orderOnRoute) {
            const owner = enclaveData[orderOnRoute.from]?.owner ?? null;
            const palette = getPaletteForOwner(owner, currentWorld);
            style = { ...style, visible: true, color: palette.target, lineWidth: 4, opacity: 1.0, dash: [8, 12], animationSpeed: 15, animationDirection: -orderOnRoute.direction };
        } else if (isConnectedToSelected) {
            const targetId = route.from === selectedEnclaveId ? route.to : route.from;
            if (isRouteDisabled) style = { ...style, visible: true, lineWidth: 1, opacity: 0.2, dash: [] };
            else if (targetId === hoveredTargetId) style = { ...style, visible: true, lineWidth: 2, opacity: 1.0, dash: [] };
            else style = { ...style, visible: true, lineWidth: 2, opacity: 0.6, dash: [] };
        } else if (isConnectedToHovered) {
             style = { ...style, visible: true, lineWidth: 1, opacity: 0.3, dash: [] };
        } else if (isRouteDisabled) {
            style = { ...style, visible: true, lineWidth: 1, opacity: 0.15, dash: [] };
        }

        if (!style.visible) return;

        ctx.save();
        ctx.globalAlpha = style.opacity; ctx.strokeStyle = style.color; ctx.lineWidth = style.lineWidth;
        ctx.setLineDash(style.dash); ctx.lineCap = 'round';
        if (style.animationSpeed > 0) {
            const totalDashLength = style.dash.reduce((a, b) => a + b, 0);
            ctx.lineDashOffset = (style.animationDirection * clockTime * style.animationSpeed) % totalDashLength;
        }
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(controlX, controlY, x2, y2); ctx.stroke();
        ctx.restore();
        
        if (isRouteDisabled) {
            ctx.save();
            if (!isConnectedToHovered && !isConnectedToSelected) ctx.globalAlpha = 0.5;
            const M = { x: (x1 + 2*controlX + x2)/4, y: (y1 + 2*controlY + y2)/4 };
            if(currentWorld) drawRouteMarker(ctx, route.isDestroyed ? 'destroyed' : 'disabled', M, clockTime, currentWorld.neutralColorPalette);
            ctx.restore();
        }
    });
};