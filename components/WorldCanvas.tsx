
import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGameEngine } from '../hooks/useGameEngine';
import { VfxManager } from '../logic/VfxManager';
import { PLAYER_THREE_COLORS } from '../data/theme';
import { useWorldGeometry } from '../hooks/useWorldGeometry';
import { useCommandZone } from '../hooks/useCommandZone';
import { useWorldRenderer } from '../hooks/useWorldRenderer';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { ActiveHighlight, SemanticColorPalette } from '../types/game';

interface WorldCanvasProps {
    gameState: ReturnType<typeof useGameEngine>;
    vfxManager: VfxManager;
    onIntroStepComplete: () => void;
    convertLatLonToVector3: (lat: number, lon: number) => THREE.Vector3;
    highlightBorderMeshes: Line2[];
    highlightBorderMaterials: LineMaterial[];
    activeHighlight: ActiveHighlight | null;
    highlightBorderOpacity: number;
    permanentBorderMeshes: Line2[];
    permanentBorderMaterials: LineMaterial[];
}

const WorldCanvas: React.FC<WorldCanvasProps> = (props) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const { gameState, convertLatLonToVector3 } = props;

    const landMaterial = useMemo(() => {
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            transparent: true,
        });

        material.onBeforeCompile = shader => {
            shader.uniforms.uPlayer1Metalness = { value: 0.0 };
            shader.uniforms.uPlayer1Roughness = { value: 1.0 };
            shader.uniforms.uPlayer1EmissiveIntensity = { value: 1.0 };
            shader.uniforms.uPlayer2Metalness = { value: 0.0 };
            shader.uniforms.uPlayer2Roughness = { value: 1.0 };
            shader.uniforms.uPlayer2EmissiveIntensity = { value: 1.0 };
            shader.uniforms.uNeutralMetalness = { value: 0.0 };
            shader.uniforms.uNeutralRoughness = { value: 1.0 };
            shader.uniforms.uNeutralEmissiveIntensity = { value: 0.3 };
            
            (material as any).uniforms = shader.uniforms;

            shader.vertexShader = `
                attribute float aOwnerType;
                varying float vOwnerType;
            ` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(
                `#include <begin_vertex>`,
                `#include <begin_vertex>
                 vOwnerType = aOwnerType;`
            );
            
            shader.fragmentShader = `
                varying float vOwnerType;
                uniform float uPlayer1Metalness;
                uniform float uPlayer1Roughness;
                uniform float uPlayer1EmissiveIntensity;
                uniform float uPlayer2Metalness;
                uniform float uPlayer2Roughness;
                uniform float uPlayer2EmissiveIntensity;
                uniform float uNeutralMetalness;
                uniform float uNeutralRoughness;
                uniform float uNeutralEmissiveIntensity;
            ` + shader.fragmentShader;

            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <color_fragment>`,
                `#include <color_fragment>
                 diffuseColor.rgb *= vColor;`
            );
            
            shader.fragmentShader = shader.fragmentShader.replace(
                `#include <metalnessmap_fragment>`,
                `#include <metalnessmap_fragment>
                 float ownerMetalness = uNeutralMetalness;
                 float ownerRoughness = uNeutralRoughness;
                 if (vOwnerType > 0.5 && vOwnerType < 1.5) { // Player 1
                     ownerMetalness = uPlayer1Metalness;
                     ownerRoughness = uPlayer1Roughness;
                 } else if (vOwnerType > 1.5 && vOwnerType < 2.5) { // Player 2
                     ownerMetalness = uPlayer2Metalness;
                     ownerRoughness = uPlayer2Roughness;
                 }
                 metalnessFactor = ownerMetalness;
                 roughnessFactor = ownerRoughness;
                `
            );

            shader.fragmentShader = shader.fragmentShader.replace(
                'vec3 totalEmissiveRadiance = emissive;',
                `
                 float ownerEmissive = uNeutralEmissiveIntensity;
                 if (vOwnerType > 0.5 && vOwnerType < 1.5) { // Player 1
                     ownerEmissive = uPlayer1EmissiveIntensity;
                 } else if (vOwnerType > 1.5 && vOwnerType < 2.5) { // Player 2
                     ownerEmissive = uPlayer2EmissiveIntensity;
                 }
                 vec3 totalEmissiveRadiance = emissive + vColor * ownerEmissive;
                `
            );
        };
        return material;
    }, []);
    
    const voidMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        transparent: true,
    }), []);

    const materials = useMemo(() => ({ landMaterial, voidMaterial }), [landMaterial, voidMaterial]);
    
    const { colorPalette, baseMaterials } = useMemo(() => {
        const currentWorld = gameState.currentWorld;
        const p1Palette: SemanticColorPalette = PLAYER_THREE_COLORS['player-1'];
        const p2Palette: SemanticColorPalette = PLAYER_THREE_COLORS['player-2'];
        const neutralPalette: SemanticColorPalette | undefined = currentWorld?.neutralColorPalette;

        const palette = {
            'player-1': {
                base: new THREE.Color(p1Palette.base),
                hover: new THREE.Color(p1Palette.hover),
                selected: new THREE.Color(p1Palette.selected),
            },
            'player-2': {
                base: new THREE.Color(p2Palette.base),
                hover: new THREE.Color(p2Palette.hover),
                selected: new THREE.Color(p2Palette.selected),
            },
            neutral: {
                base: new THREE.Color(neutralPalette?.base || '#262626'),
                hover: new THREE.Color(neutralPalette?.hover || '#373737'),
                selected: new THREE.Color(neutralPalette?.selected || '#525252'),
            },
        };

        const bases = {
            'player-1': palette['player-1'].base,
            'player-2': palette['player-2'].base,
            neutral: palette.neutral.base,
        };

        return { colorPalette: palette, baseMaterials: bases };
    }, [gameState.currentWorld]);


    const ownershipSignature = useMemo(() => 
        gameState.mapData.map(cell => `${cell.id}:${cell.owner}`).join(','), 
        [gameState.mapData]
    );

    const { cellMesh, faceToCellId, cellIdToVertices, enclaveIdToCellIds, worldSeed } = useWorldGeometry({
        mapData: gameState.mapData,
        ownershipSignature,
        currentWorld: gameState.currentWorld,
        landMaterial,
        voidMaterial,
        baseMaterials,
        convertLatLonToVector3,
    });

    const { commandBorderMeshes, commandBorderMaterials, commandFillMesh } = useCommandZone({
        gameState,
        convertLatLonToVector3,
    });

    useWorldRenderer({
        ...props,
        mountRef,
        materials,
        cellMesh,
        faceToCellId,
        cellIdToVertices,
        enclaveIdToCellIds,
        worldSeed,
        commandBorderMeshes,
        commandBorderMaterials,
        commandFillMesh,
        commandFillOpacity: 0.2,
        commandBorderOpacity: 0.8,
        highlightFillMesh: null, // Chip highlights no longer use a fill mesh
        highlightFillOpacity: 0,
        colorPalette,
    });

    return <div ref={mountRef} className="w-full h-full" />;
};

export default WorldCanvas;
