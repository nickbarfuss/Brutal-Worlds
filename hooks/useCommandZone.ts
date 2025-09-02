

import { useMemo } from 'react';
import * as THREE from 'three';
import { PLAYER_THREE_COLORS } from '../data/theme';
import { useGameEngine } from './useGameEngine';
import { useHighlightZone } from './useHighlightZone';

interface CommandZoneProps {
    gameState: ReturnType<typeof useGameEngine>;
    convertLatLonToVector3: (lat: number, lon: number) => THREE.Vector3;
}

export const useCommandZone = ({ gameState, convertLatLonToVector3 }: CommandZoneProps) => {
    const { selectedEnclaveId, enclaveData, mapData, routes } = gameState;

    const commandZoneCellIds = useMemo(() => {
        const cellIds = new Set<number>();

        if (selectedEnclaveId === null || !enclaveData[selectedEnclaveId] || enclaveData[selectedEnclaveId].owner !== 'player-1') {
            return cellIds;
        }

        // Add selected enclave's cells
        mapData.forEach(cell => {
            if (cell.enclaveId === selectedEnclaveId) {
                cellIds.add(cell.id);
            }
        });

        // Add reachable enclaves' cells
        routes.forEach(route => {
            if (route.isDestroyed || route.disabledForTurns > 0) return;
            let targetEnclaveId: number | null = null;
            if (route.from === selectedEnclaveId) targetEnclaveId = route.to;
            else if (route.to === selectedEnclaveId) targetEnclaveId = route.from;

            if (targetEnclaveId !== null) {
                mapData.forEach(cell => {
                    if (cell.enclaveId === targetEnclaveId) {
                        cellIds.add(cell.id);
                    }
                });
            }
        });

        return cellIds;
    }, [selectedEnclaveId, enclaveData, mapData, routes]);

    const borderColorMap = useMemo(() => {
        const map = new Map<string, THREE.Color>();
        map.set('default', new THREE.Color(PLAYER_THREE_COLORS['player-1'].selected));
        return map;
    }, []);

    const { borderMeshes, borderMaterials, fillMesh } = useHighlightZone({
        cellIds: commandZoneCellIds,
        mapData,
        convertLatLonToVector3,
        enabled: commandZoneCellIds.size > 0,
        borderColorMap,
        borderOpacity: 0.5,
        isAnimated: true,
        borderWidth: 5,
        borderRenderOrder: 4,
        depthTest: true,
        scale: 1.0015,
    });

    return {
        commandBorderMeshes: borderMeshes,
        commandBorderMaterials: borderMaterials,
        commandFillMesh: fillMesh,
    };
};