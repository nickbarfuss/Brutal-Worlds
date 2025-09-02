
import { useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { MapCell, Owner, HighlightType, ActiveHighlight, Enclave, Domain, Rift, Expanse, WorldProfile } from '../types/game';
import { useHighlightZone } from './useHighlightZone';
import { convertLatLonToVector3 as convertLatLonToVector3Util } from '../utils/geo';
import { PLAYER_THREE_COLORS } from '../data/theme';
import { getDomainOwner } from '../utils/entityUtils';

interface UseWorldHighlightsProps {
    mapData: MapCell[];
    enclaveData: { [id: number]: Enclave };
    domainData: { [id: number]: Domain };
    riftData: { [id: number]: Rift };
    expanseData: { [id: number]: Expanse };
    currentWorld: WorldProfile | null;
    activeHighlight: ActiveHighlight | null;
    isIntroComplete: boolean;
}

export const useWorldHighlights = ({
    mapData,
    enclaveData,
    domainData,
    riftData,
    expanseData,
    currentWorld,
    activeHighlight,
    isIntroComplete,
}: UseWorldHighlightsProps) => {

    // --- UTILITIES ---
    const convertLatLonToVector3 = useCallback((lat: number, lon: number) => {
        const sphereRadius = currentWorld?.config.SPHERE_RADIUS || 10;
        return convertLatLonToVector3Util(lat, lon, sphereRadius);
    }, [currentWorld]);

    const riftToDomainMap = useMemo(() => {
        const map = new Map<number, number>();
        if (!riftData || !mapData) return map;
        for (const rift of Object.values(riftData)) {
            const riftCells = mapData.filter(c => c.voidId === rift.id && c.voidType === 'rift');
            const neighborDomainIds = new Set<number>();
            for (const cell of riftCells) {
                for (const neighborId of cell.neighbors) {
                    const neighborCell = mapData[neighborId];
                    if (neighborCell && neighborCell.type === 'area' && neighborCell.domainId !== null) {
                        neighborDomainIds.add(neighborCell.domainId);
                    }
                }
            }
            if (neighborDomainIds.size === 1) map.set(rift.id, [...neighborDomainIds][0]);
        }
        return map;
    }, [riftData, mapData]);


    // --- DYNAMIC HIGHLIGHTS (from WorldDisplay chips) ---
    const highlightedCellIds = useMemo(() => {
        const ids = new Set<number>();
        if (!activeHighlight || !mapData) return ids;
        const { type, owners } = activeHighlight;
        if (owners.size === 0) return ids;
        
        mapData.forEach(cell => {
            let entityOwner: Owner = null, entityTypeMatches = false;
            switch (type) {
                case 'domains':
                    if (cell.domainId !== null) {
                        entityOwner = getDomainOwner(cell.domainId, enclaveData);
                        entityTypeMatches = true;
                    } else if (cell.voidType === 'rift' && cell.voidId !== null && riftToDomainMap.has(cell.voidId)) {
                        const domainId = riftToDomainMap.get(cell.voidId)!;
                        entityOwner = getDomainOwner(domainId, enclaveData);
                        entityTypeMatches = true;
                    }
                    break;
                case 'enclaves':
                    if (cell.enclaveId !== null) {
                        entityOwner = enclaveData[cell.enclaveId]?.owner;
                        entityTypeMatches = true;
                    }
                    break;
                case 'expanses': if (cell.voidType === 'expanse') { entityOwner = null; entityTypeMatches = true; } break;
                case 'rifts': if (cell.voidType === 'rift') { entityOwner = null; entityTypeMatches = true; } break;
            }
            if (entityTypeMatches && owners.has(entityOwner)) ids.add(cell.id);
        });
        return ids;
    }, [activeHighlight, mapData, enclaveData, riftData, riftToDomainMap]);

    const groupByFn = useMemo(() => {
        if (!activeHighlight) return undefined;
        return (cell: MapCell): string | null => {
            switch (activeHighlight.type) {
                case 'domains':
                    if (cell.domainId !== null) return `d-${cell.domainId}`;
                    if (cell.voidType === 'rift' && cell.voidId !== null) {
                        const domainId = riftToDomainMap.get(cell.voidId);
                        return domainId !== undefined ? `d-${domainId}` : null;
                    }
                    return null;
                case 'enclaves': return cell.enclaveId !== null ? `e-${cell.enclaveId}` : null;
                case 'expanses': return cell.voidType === 'expanse' && cell.voidId !== null ? `x-${cell.voidId}` : null;
                case 'rifts': return cell.voidType === 'rift' && cell.voidId !== null ? `r-${cell.voidId}` : null;
                default: return null;
            }
        };
    }, [activeHighlight, riftToDomainMap]);
    
    const highlightBorderOpacity = 0.6;
    const borderColorMap = useMemo(() => {
        const map = new Map<string | number, THREE.Color>();
        if (!activeHighlight || !currentWorld || !groupByFn) return map;
        const getOwnerColor = (owner: Owner) => {
            if (owner === 'player-1') return new THREE.Color(PLAYER_THREE_COLORS['player-1'].selected);
            if (owner === 'player-2') return new THREE.Color(PLAYER_THREE_COLORS['player-2'].selected);
            return new THREE.Color(currentWorld.neutralColorPalette.selected);
        };
        const allGroupIds = [...new Set(Array.from(highlightedCellIds).map(id => mapData[id]).map(groupByFn).filter((id): id is string => id !== null))];
        allGroupIds.forEach(groupId => {
            const [type, idStr] = groupId.split('-');
            const id = parseInt(idStr, 10);
            let owner: Owner = null;
            if (type === 'd') owner = getDomainOwner(id, enclaveData);
            else if (type === 'e') owner = enclaveData[id]?.owner;
            map.set(groupId, getOwnerColor(owner));
        });
        return map;
    }, [activeHighlight, currentWorld, mapData, enclaveData, highlightedCellIds, groupByFn]);

    const { 
        borderMeshes: highlightBorderMeshes, 
        borderMaterials: highlightBorderMaterials 
    } = useHighlightZone({
        cellIds: highlightedCellIds, mapData, convertLatLonToVector3, enabled: activeHighlight !== null,
        borderColorMap, borderOpacity: highlightBorderOpacity, isAnimated: true, groupBy: groupByFn,
        borderRenderOrder: 5, scale: 1.001, borderWidth: 3,
    });

    // --- PERMANENT ENCLAVE BORDERS ---
    const { player1CellIds, player2CellIds, neutralCellIds } = useMemo(() => {
        const p1Ids = new Set<number>();
        const p2Ids = new Set<number>();
        const nIds = new Set<number>();
        mapData.forEach(cell => {
            if (cell.enclaveId !== null) {
                const owner = enclaveData[cell.enclaveId]?.owner;
                if (owner === 'player-1') {
                    p1Ids.add(cell.id);
                } else if (owner === 'player-2') {
                    p2Ids.add(cell.id);
                } else {
                    nIds.add(cell.id);
                }
            }
        });
        return { player1CellIds: p1Ids, player2CellIds: p2Ids, neutralCellIds: nIds };
    }, [mapData, enclaveData]);

    const permanentGroupByFn = useCallback((cell: MapCell) => cell.enclaveId !== null ? `e-${cell.enclaveId}` : null, []);

    const permanentBorderColorMap = useMemo(() => {
        const map = new Map<string, THREE.Color>();
        if (!currentWorld || !enclaveData) return map;
    
        const neutralBorderColor = new THREE.Color(currentWorld.atmosphereColor);
        const p1Color = new THREE.Color(PLAYER_THREE_COLORS['player-1'].selected);
        const p2Color = new THREE.Color(PLAYER_THREE_COLORS['player-2'].selected);

        Object.values(enclaveData).forEach(enclave => {
            let borderColor: THREE.Color;
            switch(enclave.owner) {
                case 'player-1':
                    borderColor = p1Color;
                    break;
                case 'player-2':
                    borderColor = p2Color;
                    break;
                default: // neutral
                    borderColor = neutralBorderColor;
                    break;
            }
            map.set(`e-${enclave.id}`, borderColor);
        });
        
        return map;
    }, [currentWorld, enclaveData]);

    // Neutral borders (lowest layer)
    const {
        borderMeshes: neutralBorderMeshes,
        borderMaterials: neutralBorderMaterials,
    } = useHighlightZone({
        cellIds: neutralCellIds, mapData, convertLatLonToVector3, 
        enabled: mapData.length > 0 && Object.keys(enclaveData).length > 0 && isIntroComplete,
        borderColorMap: permanentBorderColorMap, borderOpacity: 1.0, borderWidth: 1, isAnimated: false,
        groupBy: permanentGroupByFn, borderRenderOrder: 1, scale: 1.0005,
        markAsPermanent: true,
    });

    // Player-2 borders
    const {
        borderMeshes: player2BorderMeshes,
        borderMaterials: player2BorderMaterials,
    } = useHighlightZone({
        cellIds: player2CellIds, mapData, convertLatLonToVector3, 
        enabled: mapData.length > 0 && Object.keys(enclaveData).length > 0 && isIntroComplete,
        borderColorMap: permanentBorderColorMap, borderOpacity: 1.0, borderWidth: 1.5, isAnimated: false,
        groupBy: permanentGroupByFn, borderRenderOrder: 2, scale: 1.0005,
        markAsPermanent: true,
    });
    
    // Player-1 borders (highest permanent layer)
    const {
        borderMeshes: player1BorderMeshes,
        borderMaterials: player1BorderMaterials,
    } = useHighlightZone({
        cellIds: player1CellIds, mapData, convertLatLonToVector3, 
        enabled: mapData.length > 0 && Object.keys(enclaveData).length > 0 && isIntroComplete,
        borderColorMap: permanentBorderColorMap, borderOpacity: 1.0, borderWidth: 1.5, isAnimated: false,
        groupBy: permanentGroupByFn, borderRenderOrder: 3, scale: 1.0005,
        markAsPermanent: true,
    });
    
    const permanentBorderMeshes = useMemo(() => [...neutralBorderMeshes, ...player2BorderMeshes, ...player1BorderMeshes], [neutralBorderMeshes, player2BorderMeshes, player1BorderMeshes]);
    const permanentBorderMaterials = useMemo(() => [...neutralBorderMaterials, ...player2BorderMaterials, ...player1BorderMaterials], [neutralBorderMaterials, player2BorderMaterials, player1BorderMaterials]);


    return {
        activeHighlight,
        highlightBorderMeshes, highlightBorderMaterials, highlightBorderOpacity,
        permanentBorderMeshes, permanentBorderMaterials,
        convertLatLonToVector3,
    };
};
