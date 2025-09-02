
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { MapCell } from '../types/game';

interface HighlightZoneProps {
    cellIds: Set<number>;
    mapData: MapCell[];
    convertLatLonToVector3: (lat: number, lon: number) => THREE.Vector3;
    enabled: boolean;
    fillColor?: THREE.Color | string;
    borderColorMap: Map<string | number, THREE.Color | string>;
    fillOpacity?: number;
    borderOpacity?: number;
    isAnimated?: boolean;
    groupBy?: (cell: MapCell) => string | number | null;
    borderWidth?: number;
    fillRenderOrder?: number;
    borderRenderOrder?: number;
    depthTest?: boolean;
    scale?: number;
    markAsPermanent?: boolean;
}

export const useHighlightZone = ({ 
    cellIds, mapData, convertLatLonToVector3, enabled,
    fillColor, borderColorMap, fillOpacity = 0.15, borderOpacity = 0.8, isAnimated = true,
    groupBy, borderWidth = 2, fillRenderOrder = 0, borderRenderOrder = 1,
    depthTest = true, scale = 1.002, markAsPermanent = false
}: HighlightZoneProps) => {
    const [borderMeshes, setBorderMeshes] = useState<Line2[]>([]);
    const [borderMaterials, setBorderMaterials] = useState<LineMaterial[]>([]);
    const [fillMesh, setFillMesh] = useState<THREE.Mesh | null>(null);
    const prevPropsKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const colorToString = (c: THREE.Color | string | undefined) => {
            if (!c) return '';
            if (typeof c === 'string') return c;
            return c.getHexString();
        };

        const borderColorKey = [...borderColorMap.entries()]
            .map(([k, v]) => `${k}:${colorToString(v)}`)
            .sort()
            .join(';');

        const newPropsKey = `${enabled};${[...cellIds].sort().join(',')};${colorToString(fillColor)};${borderColorKey}`;

        if (newPropsKey === prevPropsKeyRef.current) {
            return;
        }
        
        prevPropsKeyRef.current = newPropsKey;

        if (!enabled || cellIds.size === 0) {
            setBorderMeshes([]);
            setBorderMaterials([]);
            setFillMesh(null);
            return;
        }

        // --- Generate Fill Mesh (Optional) ---
        let newFillMesh: THREE.Mesh | null = null;
        if (fillColor) {
            const allFillVertices: number[] = [];
            const allFillIndices: number[] = [];
            cellIds.forEach(cellId => {
                const cell = mapData[cellId];
                if (!cell || !cell.polygon) return;
                const exteriorRing = cell.polygon.coordinates[0];
                const points3D = exteriorRing.map((p: [number, number]) => convertLatLonToVector3(p[1], p[0]).multiplyScalar(scale));
                if (points3D.length > 1 && points3D[0].equals(points3D[points3D.length - 1])) points3D.pop();
                if (points3D.length < 3) return;

                const currentVertexCount = allFillVertices.length / 3;
                points3D.forEach(v => allFillVertices.push(v.x, v.y, v.z));
                for (let i = 1; i < points3D.length - 1; i++) {
                    allFillIndices.push(currentVertexCount, currentVertexCount + i + 1, currentVertexCount + i);
                }
            });

            if (allFillVertices.length > 0) {
                const fillGeometry = new THREE.BufferGeometry();
                fillGeometry.setAttribute('position', new THREE.Float32BufferAttribute(allFillVertices, 3));
                fillGeometry.setIndex(allFillIndices);
                fillGeometry.computeVertexNormals();
                const fillMaterial = new THREE.MeshStandardMaterial({
                    color: fillColor,
                    transparent: true,
                    opacity: fillOpacity,
                    roughness: 0.8,
                    metalness: 0.1,
                    depthWrite: depthTest,
                    depthTest: depthTest,
                });
                newFillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
                newFillMesh.renderOrder = fillRenderOrder;
            }
        }
        setFillMesh(newFillMesh);
    
        // --- Generate Border Lines ---
        const segmentsByGroup = new Map<string | number, {v1: THREE.Vector3, v2: THREE.Vector3}[]>();
        const vecToString = (v: THREE.Vector3) => `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`;
        const groupByFn = groupBy || (() => 'default');

        cellIds.forEach(cellId => {
            const cell = mapData[cellId];
            if (!cell) return;
            const groupId = groupByFn(cell);
            if (groupId === null) return;

            cell.neighbors.forEach(neighborId => {
                const neighbor = mapData[neighborId];
                if (!neighbor) return;

                const isOuterBorder = !cellIds.has(neighborId);
                const isInnerBorder = cellIds.has(neighborId) && groupId !== groupByFn(neighbor);
                
                if (isOuterBorder || isInnerBorder) {
                    const cellPoints = cell.polygon.coordinates[0].map((p: [number, number]) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`);
                    const neighborPoints = neighbor.polygon.coordinates[0].map((p: [number, number]) => `${p[0].toFixed(5)},${p[1].toFixed(5)}`);
                    const sharedPointStrings = cellPoints.filter(p => neighborPoints.includes(p));
    
                    if (sharedPointStrings.length >= 2) {
                        const [p1_lon, p1_lat] = sharedPointStrings[0].split(',').map(parseFloat);
                        const [p2_lon, p2_lat] = sharedPointStrings[1].split(',').map(parseFloat);
                        const v1 = convertLatLonToVector3(p1_lat, p1_lon).multiplyScalar(scale);
                        const v2 = convertLatLonToVector3(p2_lat, p2_lon).multiplyScalar(scale);

                        if (!segmentsByGroup.has(groupId)) segmentsByGroup.set(groupId, []);
                        segmentsByGroup.get(groupId)!.push({ v1, v2 });
                    }
                }
            });
        });

        const newMeshes: Line2[] = [];
        const newMaterials: LineMaterial[] = [];

        segmentsByGroup.forEach((segments, groupId) => {
            const color = borderColorMap.get(groupId) || '#ffffff';

            const adj = new Map<string, THREE.Vector3[]>();
            segments.forEach(({ v1, v2 }) => {
                const v1Str = vecToString(v1);
                const v2Str = vecToString(v2);
                if (!adj.has(v1Str)) adj.set(v1Str, []);
                if (!adj.has(v2Str)) adj.set(v2Str, []);
                adj.get(v1Str)!.push(v2);
                adj.get(v2Str)!.push(v1);
            });

            const paths: THREE.Vector3[][] = [];
            const visitedEdges = new Set<string>();
            const stringToVec = (s: string) => new THREE.Vector3(...s.split(',').map(parseFloat));

            for (const startNodeStr of adj.keys()) {
                const neighbors = adj.get(startNodeStr) || [];
                for (const neighbor of neighbors) {
                    const neighborStr = vecToString(neighbor);
                    if (startNodeStr === neighborStr) continue;
                    const edgeKey = [startNodeStr, neighborStr].sort().join(' -> ');
                    if (visitedEdges.has(edgeKey)) continue;

                    const currentPath: THREE.Vector3[] = [stringToVec(startNodeStr)];
                    let currentNodeStr = neighborStr;
                    let prevNodeStr = startNodeStr;

                    while (true) {
                        currentPath.push(stringToVec(currentNodeStr));
                        const currentEdgeKey = [prevNodeStr, currentNodeStr].sort().join(' -> ');
                        visitedEdges.add(currentEdgeKey);
                        const nextNeighbors = adj.get(currentNodeStr) || [];
                        let nextNodeStr: string | null = null;
                        for (const nextNeighbor of nextNeighbors) {
                            const nextNeighborStr = vecToString(nextNeighbor);
                            if (nextNeighborStr === prevNodeStr) continue;
                            const nextEdgeKey = [currentNodeStr, nextNeighborStr].sort().join(' -> ');
                            if (!visitedEdges.has(nextEdgeKey)) {
                                nextNodeStr = nextNeighborStr;
                                break;
                            }
                        }
                        if (nextNodeStr) {
                            prevNodeStr = currentNodeStr;
                            currentNodeStr = nextNodeStr;
                        } else break;
                    }
                    paths.push(currentPath);
                }
            }
        
            paths.forEach(path => {
                if (path.length < 2) return;
                const positions = path.flatMap(p => [p.x, p.y, p.z]);
                
                const lineGeometry = new LineGeometry();
                lineGeometry.setPositions(positions);
                
                const lineMaterial = new LineMaterial({
                    color: color,
                    linewidth: borderWidth,
                    transparent: false, // Opaque lines prevent ugly segment overlap artifacts.
                    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
                    depthTest: depthTest,
                    polygonOffset: true,
                    polygonOffsetFactor: -1.0,
                    polygonOffsetUnits: -1.0,
                });

                const line = new Line2(lineGeometry, lineMaterial);
                if (markAsPermanent) {
                    line.userData.isPermanentBorder = true;
                }
                line.renderOrder = borderRenderOrder;
                line.computeLineDistances();
                
                newMeshes.push(line);
                newMaterials.push(lineMaterial);
            });
        });

        setBorderMeshes(newMeshes);
        setBorderMaterials(newMaterials);

        return () => {
            newMeshes.forEach(mesh => {
                mesh.geometry.dispose();
                (mesh.material as LineMaterial).dispose();
            });
            if (newFillMesh) {
                newFillMesh.geometry.dispose();
                (newFillMesh.material as THREE.Material).dispose();
            }
        };

    }, [enabled, cellIds, mapData, convertLatLonToVector3, fillColor, borderColorMap, fillOpacity, borderOpacity, isAnimated, groupBy, borderWidth, borderRenderOrder, fillRenderOrder, depthTest, scale, markAsPermanent]);

    return { borderMeshes, borderMaterials, fillMesh };
};
