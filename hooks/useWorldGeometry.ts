
import { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { MapCell, WorldProfile } from '../types/game';

interface PlanetGeometryProps {
    mapData: MapCell[];
    ownershipSignature: string;
    currentWorld: WorldProfile | null;
    landMaterial: THREE.MeshStandardMaterial;
    voidMaterial: THREE.MeshStandardMaterial;
    baseMaterials: { 'player-1': THREE.Color, 'player-2': THREE.Color, neutral: THREE.Color };
    convertLatLonToVector3: (lat: number, lon: number) => THREE.Vector3;
}

const geometryCache = new Map<number, {
    allVertices: number[];
    cellIdToVertices: Map<number, { start: number, count: number }>;
}>();

export const useWorldGeometry = ({ mapData, ownershipSignature, currentWorld, landMaterial, voidMaterial, baseMaterials, convertLatLonToVector3 }: PlanetGeometryProps) => {
    const [cellMesh, setCellMesh] = useState<THREE.Mesh | null>(null);
    const [faceToCellId, setFaceToCellId] = useState<number[]>([]);
    const [cellIdToVertices, setCellIdToVertices] = useState(new Map<number, { start: number, count: number }>());
    const [enclaveIdToCellIds, setEnclaveIdToCellIds] = useState(new Map<number, number[]>());
    
    const meshRef = useRef<THREE.Mesh | null>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);
    const lastSeedRef = useRef<number | null>(null);

    useEffect(() => {
        if (!mapData.length || !currentWorld) return;

        const seed = currentWorld.config.seed;
        const isNewWorld = seed !== lastSeedRef.current;
        
        if (isNewWorld) {
            lastSeedRef.current = seed;
            geometryCache.delete(seed);
            if (meshRef.current) {
                meshRef.current.geometry.dispose();
                meshRef.current = null;
                geometryRef.current = null;
            }
        }
        
        let cachedGeo = geometryCache.get(seed);
        if (!cachedGeo) {
            const allVertices: number[] = [];
            const localCellIdToVertices = new Map<number, { start: number, count: number }>();
            let vertexCounter = 0;

            mapData.forEach(cell => {
                const exteriorRing = cell.polygon.coordinates[0];
                const points3D = exteriorRing.map((p: [number, number]) => convertLatLonToVector3(p[1], p[0]));
                if (points3D.length > 1 && points3D[0].equals(points3D[points3D.length - 1])) points3D.pop();
                if (points3D.length < 3) return;

                const vertexStart = vertexCounter;
                points3D.forEach(v => { allVertices.push(v.x, v.y, v.z); vertexCounter++; });
                localCellIdToVertices.set(cell.id, { start: vertexStart, count: points3D.length });
            });
            
            cachedGeo = { allVertices, cellIdToVertices: localCellIdToVertices };
            geometryCache.set(seed, cachedGeo);
        }
        
        setCellIdToVertices(cachedGeo.cellIdToVertices);
        const localEnclaveIdToCellIds = new Map<number, number[]>();
        mapData.forEach(cell => {
            if (cell.enclaveId !== null) {
                if (!localEnclaveIdToCellIds.has(cell.enclaveId)) localEnclaveIdToCellIds.set(cell.enclaveId, []);
                localEnclaveIdToCellIds.get(cell.enclaveId)!.push(cell.id);
            }
        });
        setEnclaveIdToCellIds(localEnclaveIdToCellIds);
        
        const { allVertices } = cachedGeo;
        const ownerTypeFloats = new Float32Array(allVertices.length / 3);
        const allColors: number[] = new Array(allVertices.length).fill(0);
        
        mapData.forEach(cell => {
            const vertices = cachedGeo!.cellIdToVertices.get(cell.id);
            if (!vertices) return;

            let ownerType: number;
            let baseColor: THREE.Color;

            if (cell.owner === 'player-1') {
                ownerType = 1.0; baseColor = baseMaterials['player-1'];
            } else if (cell.owner === 'player-2') {
                ownerType = 2.0; baseColor = baseMaterials['player-2'];
            } else { // neutral or void
                ownerType = 0.0; baseColor = baseMaterials.neutral;
            }

            for (let i = 0; i < vertices.count; i++) {
                const vertexIndex = vertices.start + i;
                ownerTypeFloats[vertexIndex] = ownerType;
                allColors[vertexIndex * 3] = baseColor.r;
                allColors[vertexIndex * 3 + 1] = baseColor.g;
                allColors[vertexIndex * 3 + 2] = baseColor.b;
            }
        });
        
        if (isNewWorld || !meshRef.current || !geometryRef.current) {
            const landIndices: number[] = [], voidIndices: number[] = [];
            const landFaceToCellId: number[] = [], voidFaceToCellId: number[] = [];

            mapData.forEach(cell => {
                const vertices = cachedGeo!.cellIdToVertices.get(cell.id);
                if (!vertices) return;
                
                const isLand = cell.type === 'area';
                const targetIndices = isLand ? landIndices : voidIndices;
                const targetFaceToCellId = isLand ? landFaceToCellId : voidFaceToCellId;

                for (let i = 1; i < vertices.count - 1; i++) {
                    targetIndices.push(vertices.start, vertices.start + i + 1, vertices.start + i);
                    targetFaceToCellId.push(cell.id);
                }
            });

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(allVertices, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(allColors, 3));
            geometry.setAttribute('aOwnerType', new THREE.Float32BufferAttribute(ownerTypeFloats, 1));
            geometry.setIndex([...landIndices, ...voidIndices]);
            geometry.addGroup(0, landIndices.length, 0); // landMaterial
            geometry.addGroup(landIndices.length, voidIndices.length, 1); // voidMaterial
            geometry.computeVertexNormals();

            const mesh = new THREE.Mesh(geometry, [landMaterial, voidMaterial]);
            meshRef.current = mesh;
            geometryRef.current = geometry;
            setCellMesh(mesh);
            setFaceToCellId([...landFaceToCellId, ...voidFaceToCellId]);
        } else {
            const geometry = geometryRef.current;
            const ownerAttr = geometry.getAttribute('aOwnerType') as THREE.BufferAttribute;
            ownerAttr.copyArray(ownerTypeFloats);
            ownerAttr.needsUpdate = true;
            
            const colorAttr = geometry.getAttribute('color') as THREE.BufferAttribute;
            colorAttr.copyArray(new Float32Array(allColors));
            colorAttr.needsUpdate = true;
        }

    }, [ownershipSignature, currentWorld, landMaterial, voidMaterial, baseMaterials, convertLatLonToVector3, mapData]);

    return { cellMesh, faceToCellId, cellIdToVertices, enclaveIdToCellIds, worldSeed: currentWorld?.config.seed ?? -1 };
};