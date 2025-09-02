
import { ActiveDisasterMarker } from '../../types/game';

const canvasStyles = {
    disasterIcon: { radius: 12, iconFont: "16px 'Material Symbols Outlined'" },
    dynamicChip: { paddingOuterX: 4, paddingOuterY: 4, paddingInner: 6 },
    baseMarker: { radius: 14 },
};

const drawDisasterMarker = (ctx: CanvasRenderingContext2D, marker: ActiveDisasterMarker, pos: { x: number; y: number }, clockTime: number) => {
    const chipStyle = canvasStyles.dynamicChip;
    const disasterIconStyle = canvasStyles.disasterIcon;
    const baseMarkerStyle = canvasStyles.baseMarker;

    const baseMarkerWidth = baseMarkerStyle.radius * 2;
    const disasterIconWidth = disasterIconStyle.radius * 2;
    const spacingWidth = chipStyle.paddingInner;
    const totalContentWidth = baseMarkerWidth + spacingWidth + disasterIconWidth;

    const chipWidth = totalContentWidth + (chipStyle.paddingOuterX * 2);
    const chipHeight = baseMarkerStyle.radius * 2 + (chipStyle.paddingOuterY * 2);

    const chipX = pos.x - baseMarkerStyle.radius - chipStyle.paddingOuterX;
    const chipY = pos.y - baseMarkerStyle.radius - chipStyle.paddingOuterY;

    ctx.save();
    ctx.fillStyle = '#27272a'; // neutral-800
    ctx.beginPath();
    (ctx as any).roundRect(chipX, chipY, chipWidth, chipHeight, chipHeight / 2);
    ctx.fill();
    ctx.restore();

    const iconX = pos.x + baseMarkerStyle.radius + chipStyle.paddingInner + disasterIconStyle.radius;
    ctx.save();
    const pulse = (Math.sin(clockTime * Math.PI * 4) + 1) / 2;
    ctx.globalAlpha = 0.5 + pulse * 0.5;
    ctx.font = disasterIconStyle.iconFont;
    ctx.fillStyle = '#f59e0b'; // amber-400
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(marker.icon, iconX, pos.y);
    ctx.restore();
    
    ctx.save();
    ctx.fillStyle = '#f59e0b'; // amber-400
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseMarkerStyle.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
};

interface DrawAllDisastersProps {
    activeDisasterMarkers: ActiveDisasterMarker[];
    disasterMarkerScreenPositions: { [id: number]: { x: number; y: number; visible: boolean } };
    clockTime: number;
}

export const drawAllDisasterMarkers = (ctx: CanvasRenderingContext2D, props: DrawAllDisastersProps) => {
    const { activeDisasterMarkers, disasterMarkerScreenPositions, clockTime } = props;
    
    activeDisasterMarkers.forEach((marker, i) => {
        const pos = disasterMarkerScreenPositions[i];
        if (pos && pos.visible) {
            drawDisasterMarker(ctx, marker, pos, clockTime);
        }
    });
};
