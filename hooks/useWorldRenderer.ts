
import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { useGameEngine } from './useGameEngine';
import { VfxManager } from '../logic/VfxManager';
import { drawUICanvas } from '../canvas/drawingUtils';
import { Enclave, ActiveHighlight } from '../types/game';
import { mainNebulaVertexShader, mainNebulaFragmentShader, wispyNebulaVertexShader, wispyNebulaFragmentShader, atmosphereVertexShader, atmosphereFragmentShader, sunVertexShader, sunFragmentShader } from '../canvas/shaderUtils';
import { createStarfield, createWarpStars } from '../canvas/starfieldUtils';

// --- CONSOLIDATED HOOK LOGIC ---
// Durations for the cinematic intro sequence
const WARP_DURATION = 3000;
const ZOOM_DURATION = 500;
const REVEAL_DURATION = 1900;

// Layer for objects that should glow
const BLOOM_LAYER = 1;

interface ColorPalette {
    'player-1': { base: THREE.Color, hover: THREE.Color, selected: THREE.Color };
    'player-2': { base: THREE.Color, hover: THREE.Color, selected: THREE.Color };
    neutral: { base: THREE.Color, hover: THREE.Color, selected: THREE.Color };
}

interface MapRendererProps {
    mountRef: React.RefObject<HTMLDivElement>;
    gameState: ReturnType<typeof useGameEngine>;
    vfxManager: VfxManager;
    onIntroStepComplete: () => void;
    materials: {
        landMaterial: THREE.MeshStandardMaterial;
        voidMaterial: THREE.MeshStandardMaterial;
    };
    cellMesh: THREE.Mesh | null;
    faceToCellId: number[];
    cellIdToVertices: Map<number, { start: number, count: number }>;
    enclaveIdToCellIds: Map<number, number[]>;
    worldSeed: number;
    commandBorderMeshes: Line2[];
    commandBorderMaterials: LineMaterial[];
    commandFillMesh: THREE.Mesh | null;
    commandFillOpacity: number;
    commandBorderOpacity: number;
    highlightBorderMeshes: Line2[];
    highlightBorderMaterials: LineMaterial[];
    highlightFillMesh: THREE.Mesh | null;
    highlightFillOpacity: number;
    highlightBorderOpacity: number;
    colorPalette: ColorPalette;
    activeHighlight: ActiveHighlight | null;
    permanentBorderMeshes: Line2[];
    permanentBorderMaterials: LineMaterial[];
}

const easeOutQuad = (t: number) => t * (2 - t);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const updateVertexColors = (
    time: number,
    geometry: THREE.BufferGeometry,
    enclaveIdToCellIds: Map<number, number[]>,
    cellIdToVertices: Map<number, { start: number, count: number }>,
    enclaveData: { [id: number]: Enclave },
    hoveredEnclaveId: number | null,
    lastHoveredEnclaveId: number | null,
    selectedEnclaveId: number | null,
    colorPalette: ColorPalette,
    objectColorTransitions: Map<number, { from: THREE.Color; to: THREE.Color; startTime: number; duration: number; easing: (t: number) => number; }>,
    lastTargetColors: Map<number, THREE.Color>
) => {
    const colors = geometry.attributes.color as THREE.BufferAttribute;
    if (!colors) return;
    let needsUpdate = false;

    const getTargetColorForEnclave = (enclave: Enclave): THREE.Color => {
        const palette = enclave.owner === 'player-1' ? colorPalette['player-1']
                      : enclave.owner === 'player-2' ? colorPalette['player-2']
                      : colorPalette.neutral;
        if (enclave.id === selectedEnclaveId) return palette.selected;
        if (enclave.id === hoveredEnclaveId) return palette.hover;
        return palette.base;
    };

    for (const [enclaveIdStr, enclave] of Object.entries(enclaveData)) {
        const enclaveId = parseInt(enclaveIdStr, 10);
        const targetColor = getTargetColorForEnclave(enclave);
        const lastTargetColor = lastTargetColors.get(enclaveId);

        if (!lastTargetColor || !lastTargetColor.equals(targetColor)) {
            const currentTransition = objectColorTransitions.get(enclaveId);
            const fromColor = currentTransition ? 
                new THREE.Color().lerpColors(currentTransition.from, currentTransition.to, currentTransition.easing(Math.min((time - currentTransition.startTime) / currentTransition.duration, 1.0)))
                : (lastTargetColor || targetColor.clone()); 
            
            let duration = 200;
            const wasHovered = enclaveId === lastHoveredEnclaveId;
            const isHovered = enclaveId === hoveredEnclaveId;
            
            if (!wasHovered && isHovered) { duration = 150; } 
            else if (wasHovered && !isHovered) { duration = 400; }

            objectColorTransitions.set(enclaveId, {
                from: fromColor.clone(), to: targetColor.clone(), startTime: time,
                duration: duration, easing: easeOutQuad,
            });
            lastTargetColors.set(enclaveId, targetColor.clone());
        }
    }
    
    if (objectColorTransitions.size > 0) {
        needsUpdate = true;
        const transitionsToDelete: number[] = [];

        objectColorTransitions.forEach((transition, enclaveId) => {
            const progress = Math.min((time - transition.startTime) / transition.duration, 1.0);
            const easedProgress = transition.easing(progress);
            const currentColor = new THREE.Color().lerpColors(transition.from, transition.to, easedProgress);

            const cellIds = enclaveIdToCellIds.get(enclaveId);
            if (cellIds) {
                cellIds.forEach(cellId => {
                    const vertices = cellIdToVertices.get(cellId);
                    if (vertices) {
                        for (let i = 0; i < vertices.count; i++) {
                            colors.setXYZ(vertices.start + i, currentColor.r, currentColor.g, currentColor.b);
                        }
                    }
                });
            }
            if (progress >= 1.0) transitionsToDelete.push(enclaveId);
        });

        transitionsToDelete.forEach(id => objectColorTransitions.delete(id));
    }
    
    if (needsUpdate) colors.needsUpdate = true;
};

// Simplified handler to just add/remove meshes without animations.
const handleHighlightMeshes = (
    mapContainer: THREE.Object3D,
    currentMeshes: any,
    dynamicProps: any,
    isUiVisible: boolean
) => {
    const {
        commandFillMesh: newCommandFill, commandBorderMeshes: newCommandBorders,
        highlightFillMesh: newHighlightFill, highlightBorderMeshes: newHighlightBorders,
        permanentBorderMeshes: newPermanentBorders,
    } = dynamicProps;

    // --- Permanent Borders ---
    if (newPermanentBorders !== currentMeshes.permanent) {
        if (currentMeshes.permanent) currentMeshes.permanent.forEach((m: THREE.Object3D) => mapContainer.remove(m));
        currentMeshes.permanent = newPermanentBorders;
        if (currentMeshes.permanent) currentMeshes.permanent.forEach((m: THREE.Object3D) => mapContainer.add(m));
    }
    if (currentMeshes.permanent) {
        currentMeshes.permanent.forEach((m: THREE.Object3D) => (m.visible = isUiVisible));
    }

    // --- Command Zone ---
    if (newCommandFill !== currentMeshes.commandFill) {
        if (currentMeshes.commandFill) mapContainer.remove(currentMeshes.commandFill);
        currentMeshes.commandFill = newCommandFill;
        if (currentMeshes.commandFill) mapContainer.add(currentMeshes.commandFill);
    }
    if (newCommandBorders !== currentMeshes.commandBorders) {
        if (currentMeshes.commandBorders) currentMeshes.commandBorders.forEach((m: THREE.Object3D) => mapContainer.remove(m));
        currentMeshes.commandBorders = newCommandBorders;
        if (currentMeshes.commandBorders) currentMeshes.commandBorders.forEach((m: THREE.Object3D) => mapContainer.add(m));
    }

    // --- Highlight Zone ---
    if (newHighlightFill !== currentMeshes.highlightFill) {
        if (currentMeshes.highlightFill) mapContainer.remove(currentMeshes.highlightFill);
        currentMeshes.highlightFill = newHighlightFill;
        if (currentMeshes.highlightFill) mapContainer.add(currentMeshes.highlightFill);
    }
    if (newHighlightBorders !== currentMeshes.highlightBorders) {
        if (currentMeshes.highlightBorders) currentMeshes.highlightBorders.forEach((m: THREE.Object3D) => mapContainer.remove(m));
        currentMeshes.highlightBorders = newHighlightBorders;
        if (currentMeshes.highlightBorders) currentMeshes.highlightBorders.forEach((m: THREE.Object3D) => mapContainer.add(m));
    }
};

export const useWorldRenderer = (props: MapRendererProps) => {
    const { mountRef, onIntroStepComplete } = props;

    const stateRef = useRef({
        props,
        pointerInteraction: { lastClickTime: 0, isPointerDown: false, pointerDownTime: 0, pointerDownPosition: new THREE.Vector2(), isDragging: false, },
        objectColorTransitions: new Map<number, any>(),
        lastTargetColors: new Map<number, THREE.Color>(),
        lastHoveredEnclaveId: null as number | null,
        currentMeshes: {} as any,
        uiFadeInState: { startTime: 0, active: false, complete: false },
        // Intro Animation State
        introAnimation: {
            stepStartTime: 0,
            transitionComplete: false,
            initialRotationApplied: false,
            cameraStartPos: new THREE.Vector3(),
            startRoll: 0,
            rollStartTime: 0,
            totalRollDuration: ZOOM_DURATION + REVEAL_DURATION,
        },
        focusAnimationState: null as { startPos: THREE.Vector3; startTarget: THREE.Vector3; endTarget: THREE.Vector3; startTime: number; } | null,
    });
    
    stateRef.current.props = props;

    const warpStarsData = useMemo(() => {
        const stars = createWarpStars();
        return { mesh: stars.mesh, update: stars.update };
    }, [props.worldSeed]);

    useEffect(() => {
        if (!mountRef.current || !props.gameState.currentWorld) return;

        // --- ONE-TIME SETUP ---
        const state = stateRef.current;
        state.uiFadeInState = { startTime: 0, active: false, complete: false };
        // FIX: The intro animation state was not being reset when a new game started,
        // causing the intro to break on subsequent playthroughs. This ensures all
        // animation-related state is reset to its initial values.
        state.introAnimation = {
            stepStartTime: 0,
            transitionComplete: false,
            initialRotationApplied: false,
            cameraStartPos: new THREE.Vector3(),
            startRoll: 0,
            rollStartTime: 0,
            totalRollDuration: ZOOM_DURATION + REVEAL_DURATION,
        };
        state.objectColorTransitions.clear();
        state.lastTargetColors.clear();
        
        const { SPHERE_RADIUS } = props.gameState.currentWorld.config;
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
        camera.position.z = SPHERE_RADIUS * 35;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1);
        mountRef.current.appendChild(renderer.domElement);
        
        const renderScene = new RenderPass(scene, camera);
        
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.8, 0.1);
        
        const bloomComposer = new EffectComposer(renderer);
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass(renderScene);
        bloomComposer.addPass(bloomPass);

        const finalPass = new ShaderPass(
          new THREE.ShaderMaterial({
            uniforms: {
              baseTexture: { value: null },
              bloomTexture: { value: bloomComposer.renderTarget2.texture }
            },
            vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }`,
            fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
                }`
          }), 'baseTexture'
        );
        finalPass.needsSwap = true;

        const finalComposer = new EffectComposer(renderer);
        finalComposer.addPass(renderScene);
        finalComposer.addPass(finalPass);

        const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
        const materials: { [key: string]: THREE.Material | THREE.Material[] } = {};

        const bloomLayer = new THREE.Layers();
        bloomLayer.set(BLOOM_LAYER);

        const darkenNonBloomed = (obj: THREE.Object3D) => {
            const isMeshOrPoints = obj instanceof THREE.Mesh || obj instanceof THREE.Points;
            if (isMeshOrPoints && !bloomLayer.test(obj.layers)) {
                materials[obj.uuid] = (obj as THREE.Mesh | THREE.Points).material;
                (obj as THREE.Mesh | THREE.Points).material = darkMaterial;
            }
        };
        
        const restoreMaterial = (obj: THREE.Object3D) => {
            if (materials[obj.uuid]) {
                (obj as THREE.Mesh | THREE.Points).material = materials[obj.uuid] as THREE.Material;
                delete materials[obj.uuid];
            }
        };

        const uiCanvas = document.createElement('canvas');
        uiCanvas.style.cssText = 'position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none; z-index: 10;';
        mountRef.current.appendChild(uiCanvas);
        const dpr = window.devicePixelRatio || 1;
        uiCanvas.width = window.innerWidth * dpr;
        uiCanvas.height = window.innerHeight * dpr;
        const uiContext = uiCanvas.getContext('2d');
        if (uiContext) uiContext.scale(dpr, dpr);
        
        const worldGroup = new THREE.Group();
        worldGroup.visible = false;
        scene.add(worldGroup);

        const mapContainer = new THREE.Object3D();
        worldGroup.add(mapContainer);
        
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.minDistance = SPHERE_RADIUS * 2.0;
        controls.maxDistance = SPHERE_RADIUS * 7.0;
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.2;
        controls.enabled = false;

        const hemisphereLight = new THREE.HemisphereLight(
            new THREE.Color(0x607080), // A cool, cosmic sky color
            new THREE.Color(props.gameState.currentWorld.atmosphereColor), // Ground color from planet's atmosphere
            props.gameState.ambientLightIntensity
        );
        scene.add(hemisphereLight);
        
        const sunPosition = new THREE.Vector3(SPHERE_RADIUS * 20, SPHERE_RADIUS * 50, SPHERE_RADIUS * 100);
        const pointLight = new THREE.PointLight(new THREE.Color(props.gameState.currentWorld.sunColor), 5000, 0, 1.0);
        pointLight.position.copy(sunPosition);
        scene.add(pointLight);

        const sunScale = props.gameState.currentWorld.sunScale || 1.0;
        const sunGeom = new THREE.PlaneGeometry(SPHERE_RADIUS * 1.0, SPHERE_RADIUS * 1.0);
        const sunMat = new THREE.ShaderMaterial({
            uniforms: {
                sunColor: { value: new THREE.Color(props.gameState.currentWorld.sunColor) },
                u_time: { value: 0.0 },
                tonemapping: { value: 0.15 }
            },
            vertexShader: sunVertexShader, fragmentShader: sunFragmentShader,
            blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
        });
        const sun = new THREE.Mesh(sunGeom, sunMat);
        sun.position.copy(sunPosition);
        sun.scale.set(sunScale, sunScale, 1.0);
        sun.layers.enable(BLOOM_LAYER);
        worldGroup.add(sun);

        const atmosphereColor = new THREE.Color(props.gameState.currentWorld.atmosphereColor);
        const innerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(SPHERE_RADIUS * 1.005, 64, 64),
            new THREE.ShaderMaterial({
                uniforms: { glowColor: { value: atmosphereColor }, intensityMultiplier: { value: 1.5 }, falloffPower: { value: 1.0 } },
                vertexShader: atmosphereVertexShader, fragmentShader: atmosphereFragmentShader,
                blending: THREE.AdditiveBlending, side: THREE.FrontSide, transparent: true, depthWrite: false,
            })
        );
        innerGlow.name = 'atmosphere-inner';
        innerGlow.renderOrder = 0;
        innerGlow.layers.enable(BLOOM_LAYER);
        mapContainer.add(innerGlow);
        const outerGlow = new THREE.Mesh(
            new THREE.SphereGeometry(SPHERE_RADIUS * 1.015, 64, 64),
            new THREE.ShaderMaterial({
                uniforms: { glowColor: { value: atmosphereColor }, intensityMultiplier: { value: 2.0 }, falloffPower: { value: 1.8 } },
                vertexShader: atmosphereVertexShader, fragmentShader: atmosphereFragmentShader,
                blending: THREE.AdditiveBlending, side: THREE.BackSide, transparent: true, depthWrite: false,
            })
        );
        outerGlow.name = 'atmosphere-outer';
        outerGlow.renderOrder = 0;
        outerGlow.layers.enable(BLOOM_LAYER);
        mapContainer.add(outerGlow);

        const starfield1 = createStarfield(20000, SPHERE_RADIUS * 40, 3.0);
        worldGroup.add(starfield1);
        const starfield2 = createStarfield(20000, SPHERE_RADIUS * 80, 2.4);
        worldGroup.add(starfield2);

        const nebulaGroup = new THREE.Group();
        const worldNebulaConfig = props.gameState.currentWorld.nebula;
        const mainNebulaMaterial = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(worldNebulaConfig.main.color) }, density: { value: worldNebulaConfig.main.density * 6.0 }, opacity: { value: 1.0 } }, vertexShader: mainNebulaVertexShader, fragmentShader: mainNebulaFragmentShader, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, });
        const wispyNebulaMaterial = new THREE.ShaderMaterial({ uniforms: { color: { value: new THREE.Color(worldNebulaConfig.wispy.color) }, density: { value: worldNebulaConfig.wispy.density * 6.0 }, falloff: { value: worldNebulaConfig.wispy.falloff }, opacity: { value: 1.0 } }, vertexShader: wispyNebulaVertexShader, fragmentShader: wispyNebulaFragmentShader, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, });
        for (let i = 0; i < 12; i++) {
            const mat = (Math.random() > 0.4 ? mainNebulaMaterial : wispyNebulaMaterial).clone();
            const opacity = 0.4 + Math.random() * 0.6;
            mat.uniforms.opacity.value = opacity;
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
            plane.userData.baseOpacity = opacity;
            plane.position.copy(new THREE.Vector3((Math.random() - 0.5), (Math.random() - 0.5), (Math.random() - 0.5)).normalize().multiplyScalar(SPHERE_RADIUS * 180 * (1 + (Math.random() - 0.5) * 0.2)));
            const scale = (Math.random() * 10.0 + 5.0) * (SPHERE_RADIUS * 180) * 0.5;
            plane.scale.set(scale, scale, scale);
            plane.rotation.z = Math.random() * Math.PI * 2;
            nebulaGroup.add(plane);
        }
        worldGroup.add(nebulaGroup);
        scene.add(warpStarsData.mesh);
        
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const clock = new THREE.Clock();
        
        const setWorldOpacity = (opacity: number) => {
            worldGroup.traverse((child: any) => {
                if (child.isMesh || child.isPoints) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        const baseOpacity = material.userData.baseOpacity ?? 1.0;
                        
                        if (material.uniforms) {
                            if (material.uniforms.globalOpacity) { // For starfields
                                material.uniforms.globalOpacity.value = opacity;
                                return;
                            }
                            if (material.uniforms.opacity) { // For nebulas
                                material.uniforms.opacity.value = baseOpacity * opacity;
                            }
                        }

                        if (material.transparent === false) material.transparent = true;
                        material.opacity = baseOpacity * opacity;
                    });
                }
                if (child.isLine2) {
                    if (child.userData.isPermanentBorder) {
                        return; // Permanent borders have their own opacity logic
                    }
                    const material = child.material as LineMaterial;
                    if (material && material.isLineMaterial) {
                        if (material.transparent === false) material.transparent = true;
                        const baseOpacity = material.userData.baseOpacity ?? 1.0;
                        material.opacity = baseOpacity * opacity;
                    }
                }
            });
        };
        
        const getCellIdFromEvent = (p: THREE.Vector2): number | null => {
            const { cellMesh, faceToCellId } = stateRef.current.props;
            if (!cellMesh) return null;
            raycaster.setFromCamera(p, camera);
            const intersects = raycaster.intersectObject(cellMesh);
            return (intersects.length > 0 && intersects[0].faceIndex !== undefined) ? faceToCellId[intersects[0].faceIndex] : null;
        };
        const onPointerDown = (event: PointerEvent) => {
            const { gameState } = stateRef.current.props;
            if (gameState.introStep !== 'reveal' && gameState.introStep !== 'none') return;
            state.pointerInteraction.isPointerDown = true;
            state.pointerInteraction.isDragging = false;
            state.pointerInteraction.pointerDownTime = performance.now();
            state.pointerInteraction.pointerDownPosition.set(event.clientX, event.clientY);
        };
        const onPointerUp = () => {
            const { gameState } = stateRef.current.props;
            if (!state.pointerInteraction.isPointerDown || (gameState.introStep !== 'reveal' && gameState.introStep !== 'none')) return;

            state.pointerInteraction.isPointerDown = false;
            const pressDuration = performance.now() - state.pointerInteraction.pointerDownTime;
            if (!state.pointerInteraction.isDragging && pressDuration < 300) {
                const now = performance.now();
                const cellId = getCellIdFromEvent(pointer);
                if (now - state.pointerInteraction.lastClickTime < 300) {
                    if (cellId !== null) {
                        const enclaveId = gameState.mapData[cellId]?.enclaveId;
                        if (enclaveId !== null && enclaveId !== undefined) {
                            gameState.handleEnclaveDblClick(enclaveId);
                        }
                    }
                    state.pointerInteraction.lastClickTime = 0;
                } else {
                    gameState.handleMapClick(cellId);
                    state.pointerInteraction.lastClickTime = now;
                }
            }
        };
        const onPointerMove = (event: PointerEvent) => {
            if (mountRef.current) {
                const rect = mountRef.current.getBoundingClientRect();
                pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            }
            if (state.pointerInteraction.isPointerDown && !state.pointerInteraction.isDragging) {
                if (new THREE.Vector2(event.clientX, event.clientY).distanceTo(state.pointerInteraction.pointerDownPosition) > 5) {
                    state.pointerInteraction.isDragging = true;
                }
            }
        };
        const container = mountRef.current;
        container.addEventListener('pointerdown', onPointerDown);
        container.addEventListener('pointermove', onPointerMove);
        container.addEventListener('pointerup', onPointerUp);
        container.addEventListener('pointerleave', onPointerUp);
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            bloomComposer.setSize(window.innerWidth, window.innerHeight);
            finalComposer.setSize(window.innerWidth, window.innerHeight);
            
            uiCanvas.width = window.innerWidth * dpr;
            uiCanvas.height = window.innerHeight * dpr;
            uiContext?.scale(dpr, dpr);
            
            const { commandBorderMaterials, highlightBorderMaterials, permanentBorderMaterials } = stateRef.current.props;
            const allLineMaterials: LineMaterial[] = [
                ...(commandBorderMaterials || []),
                ...(highlightBorderMaterials || []),
                ...(permanentBorderMaterials || []),
            ];
            allLineMaterials.forEach(mat => {
                if (mat) mat.resolution.set(window.innerWidth, window.innerHeight);
            });
        };
        window.addEventListener('resize', handleResize);

        let animationFrameId: number;
        const animate = (time: number) => {
            animationFrameId = requestAnimationFrame(animate);
            const { props: currentProps } = stateRef.current;
            const { gameState, vfxManager, cellMesh, materials, cellIdToVertices, enclaveIdToCellIds, colorPalette, activeHighlight, permanentBorderMaterials, ...highlightProps } = currentProps;
            
            const { isBloomEnabled, bloomSettings, materialSettings, ambientLightIntensity, tonemappingStrength } = gameState;

            hemisphereLight.intensity = ambientLightIntensity;

            if (isBloomEnabled) {
                bloomPass.threshold = bloomSettings.threshold;
                bloomPass.strength = bloomSettings.strength;
                bloomPass.radius = bloomSettings.radius;
            }
            
            const landMaterialUniforms = (materials.landMaterial as any).uniforms;
            if (landMaterialUniforms) {
                landMaterialUniforms.uPlayer1Metalness.value = materialSettings.player.metalness;
                landMaterialUniforms.uPlayer1Roughness.value = materialSettings.player.roughness;
                landMaterialUniforms.uPlayer1EmissiveIntensity.value = materialSettings.player.emissiveIntensity;
                landMaterialUniforms.uPlayer2Metalness.value = materialSettings.player.metalness;
                landMaterialUniforms.uPlayer2Roughness.value = materialSettings.player.roughness;
                landMaterialUniforms.uPlayer2EmissiveIntensity.value = materialSettings.player.emissiveIntensity;
                landMaterialUniforms.uNeutralMetalness.value = materialSettings.neutral.metalness;
                landMaterialUniforms.uNeutralRoughness.value = materialSettings.neutral.roughness;
                landMaterialUniforms.uNeutralEmissiveIntensity.value = materialSettings.neutral.emissiveIntensity;
            }
            if (materials.voidMaterial && materialSettings.void && gameState.currentWorld) {
                materials.voidMaterial.metalness = materialSettings.void.metalness;
                materials.voidMaterial.roughness = materialSettings.void.roughness;
                const voidColor = new THREE.Color(gameState.currentWorld.worldColorTheme.three.dark || '#000000');
                materials.voidMaterial.color.copy(voidColor);
                materials.voidMaterial.emissive.copy(voidColor);
                materials.voidMaterial.emissiveIntensity = materialSettings.void.emissiveIntensity ?? 0;
            }


            const existingCellMesh = mapContainer.getObjectByName('cellMesh');
            if (cellMesh !== existingCellMesh) {
                if (existingCellMesh) mapContainer.remove(existingCellMesh);
                if (cellMesh) { cellMesh.name = 'cellMesh'; mapContainer.add(cellMesh); }
            }

            const { introStep, initialCameraTarget, cameraFocusAnimation, focusOnEnclave } = gameState;
            if (state.focusAnimationState) {
                const anim = state.focusAnimationState;
                const progress = Math.min((time - anim.startTime) / 500, 1.0);
                const easedProgress = 0.5 * (1 - Math.cos(Math.PI * progress));
                const offset = new THREE.Vector3().subVectors(anim.startPos, anim.startTarget);
                const finalCamPos = new THREE.Vector3().addVectors(anim.endTarget, offset);
                camera.position.lerpVectors(anim.startPos, finalCamPos, easedProgress);
                controls.target.lerpVectors(anim.startTarget, anim.endTarget, easedProgress);
                if (progress >= 1.0) {
                    state.focusAnimationState = null;
                    focusOnEnclave(-1);
                }
            } else if (cameraFocusAnimation?.active) {
                state.focusAnimationState = { startPos: camera.position.clone(), startTarget: controls.target.clone(), endTarget: cameraFocusAnimation.target, startTime: time };
            }

            handleHighlightMeshes(mapContainer, state.currentMeshes, { ...highlightProps, permanentBorderMaterials }, gameState.isIntroComplete);

            const anim = state.introAnimation;
            if (anim.stepStartTime === 0) { // First frame of intro
                anim.stepStartTime = time;
                anim.cameraStartPos.copy(camera.position);
            }
            const stepElapsedTime = time - anim.stepStartTime;
            
            switch (introStep) {
                case 'warp':
                    worldGroup.visible = false;
                    warpStarsData.mesh.visible = true;
                    (warpStarsData.mesh.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = easeOutQuad(Math.min(stepElapsedTime / 1000, 1.0));
                    
                    if (stepElapsedTime >= WARP_DURATION) {
                        if (initialCameraTarget && !anim.initialRotationApplied) {
                            const endQuat = new THREE.Quaternion().setFromUnitVectors(initialCameraTarget.clone().normalize(), new THREE.Vector3(0, 0, 1).negate());
                            mapContainer.quaternion.copy(endQuat);
                            anim.initialRotationApplied = true;
                        }
                        // Set a random roll angle for the next step (zoom)
                        const randomRoll = (Math.random() * (180 - 45) + 45) * THREE.MathUtils.DEG2RAD;
                        anim.startRoll = randomRoll * (Math.random() < 0.5 ? 1 : -1);

                        onIntroStepComplete();
                        anim.stepStartTime = time; 
                    }
                    break;
                case 'zoom': {
                    if (anim.rollStartTime === 0) {
                        anim.rollStartTime = time;
                    }

                    // --- Combined Roll Logic ---
                    const rollElapsedTime = time - anim.rollStartTime;
                    const rollProgress = Math.min(rollElapsedTime / anim.totalRollDuration, 1.0);
                    const easedRollProgress = easeOutCubic(rollProgress);
                    const rollAngle = anim.startRoll * (1.0 - easedRollProgress);
                    camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
                    
                    // --- Independent Zoom Logic ---
                    const zoomProgress = Math.min(stepElapsedTime / ZOOM_DURATION, 1.0);
                    const easedZoomProgress = easeOutCubic(zoomProgress);
                    const endPos = new THREE.Vector3(0, 0, SPHERE_RADIUS * 3.5);
                    camera.position.lerpVectors(anim.cameraStartPos, endPos, easedZoomProgress);
                    
                    // FIX: Explicitly call lookAt to ensure the camera matrix is stable
                    // when manipulating both position and up vectors simultaneously.
                    camera.lookAt(0, 0, 0);

                    worldGroup.visible = true;
                    setWorldOpacity(easedZoomProgress);

                    warpStarsData.mesh.visible = true;
                    (warpStarsData.mesh.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = 1.0 - easedZoomProgress;

                    if (zoomProgress >= 1.0) {
                        onIntroStepComplete();
                        anim.stepStartTime = time;
                    }
                    break;
                }
                case 'reveal': {
                     // --- Continue Roll Logic ---
                     if (anim.rollStartTime === 0) { // Safety check in case of refresh/skip
                        anim.rollStartTime = time - ZOOM_DURATION; // Estimate start time
                     }
                    const rollElapsedTime = time - anim.rollStartTime;
                    const rollProgress = Math.min(rollElapsedTime / anim.totalRollDuration, 1.0);
                    const easedRollProgress = easeOutCubic(rollProgress);
                    const rollAngle = anim.startRoll * (1.0 - easedRollProgress);
                    camera.up.set(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), rollAngle);
                    
                    // FIX: Explicitly call lookAt here as well for stability.
                    camera.lookAt(0, 0, 0);

                    if (stepElapsedTime >= REVEAL_DURATION) {
                        camera.up.set(0, 1, 0); // Reset up vector to default at the end
                        onIntroStepComplete();
                        anim.stepStartTime = time;
                        anim.rollStartTime = 0; // Reset for next game
                    }
                    controls.autoRotate = true;
                    controls.enabled = true;
                    break;
                }
                case 'none':
                    worldGroup.visible = true;
                    setWorldOpacity(1.0);
                    warpStarsData.mesh.visible = false;
                    (warpStarsData.mesh.material as THREE.ShaderMaterial).uniforms.globalOpacity.value = 0.0;
                    break;
            }
            
            if (warpStarsData.mesh.visible) {
                warpStarsData.update(camera, introStep === 'warp', introStep === 'zoom' ? 1.0 + stepElapsedTime / ZOOM_DURATION * 8.0 : 1.0);
            }
            
            controls.update(clock.getDelta());
            
            const isFocusAnimating = !!state.focusAnimationState;
            const canStartInteracting = introStep === 'reveal' || introStep === 'none';
            const canInteract = canStartInteracting && !isFocusAnimating;
            controls.enabled = canInteract;
            controls.autoRotate = (introStep === 'reveal' || (introStep === 'none' && !gameState.isPaused)) && !isFocusAnimating;
            
            sun.lookAt(camera.position);
            (sun.material as THREE.ShaderMaterial).uniforms.u_time.value = time * 0.0005;
            (sun.material as THREE.ShaderMaterial).uniforms.tonemapping.value = tonemappingStrength;
            nebulaGroup.children.forEach(child => child.lookAt(camera.position));
            
            let uiCanvasOpacity = 0.0;
            if (gameState.isIntroComplete) {
                if (!state.uiFadeInState.active && !state.uiFadeInState.complete) {
                    state.uiFadeInState = { startTime: time, active: true, complete: false };
                }
                if (state.uiFadeInState.active) {
                    const timeSinceStart = time - state.uiFadeInState.startTime;
                    const delay = 200;
                    const duration = 1600;
                    if (timeSinceStart > delay) {
                        uiCanvasOpacity = 0.5 * (1 - Math.cos(Math.PI * Math.min((timeSinceStart - delay) / duration, 1.0)));
                    }
                    if (timeSinceStart >= delay + duration) {
                        state.uiFadeInState.active = false;
                        state.uiFadeInState.complete = true;
                    }
                } else if (state.uiFadeInState.complete) {
                    uiCanvasOpacity = 1.0;
                }
            }

            if (isBloomEnabled) {
                // To ensure non-glowing objects don't contribute, make them invisible or black.
                // Making them invisible is more robust.
                starfield1.visible = false;
                starfield2.visible = false;
                nebulaGroup.visible = false;

                scene.traverse(darkenNonBloomed);
                bloomComposer.render();
                scene.traverse(restoreMaterial);
                
                // Restore visibility for the final render pass
                starfield1.visible = true;
                starfield2.visible = true;
                nebulaGroup.visible = true;

                finalComposer.render();
            } else {
                renderer.render(scene, camera);
            }

            if (uiContext) drawUICanvas(uiContext, clock.getElapsedTime(), gameState, vfxManager, camera, mapContainer, activeHighlight, uiCanvasOpacity);

            if (canInteract && cellMesh) {
                const hoveredEnclaveId = gameState.mapData[gameState.hoveredCellId]?.enclaveId ?? null;
                updateVertexColors(time, cellMesh.geometry, enclaveIdToCellIds, cellIdToVertices, gameState.enclaveData, hoveredEnclaveId, state.lastHoveredEnclaveId, gameState.selectedEnclaveId, colorPalette, state.objectColorTransitions, state.lastTargetColors);
                state.lastHoveredEnclaveId = hoveredEnclaveId;
                const cellId = getCellIdFromEvent(pointer);
                if (gameState.hoveredCellId !== cellId) gameState.setHoveredCellId(cellId ?? -1);
            }
        };
        animate(0);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('pointerdown', onPointerDown);
            container.removeEventListener('pointermove', onPointerMove);
            container.removeEventListener('pointerup', onPointerUp);
            container.removeEventListener('pointerleave', onPointerUp);
            if (renderer && container) container.removeChild(renderer.domElement);
            if (uiCanvas && container) container.removeChild(uiCanvas);
            scene.traverse(object => {
                const obj = object as any;
                if (obj instanceof THREE.Mesh || obj instanceof Line2 || obj instanceof THREE.Points) {
                    if (obj.geometry) obj.geometry.dispose();
                    if (obj.material) {
                        if (Array.isArray(obj.material)) obj.material.forEach((m: THREE.Material) => m.dispose());
                        else obj.material.dispose();
                    }
                }
            });
            bloomComposer.dispose();
            finalComposer.dispose();
            renderer.dispose();
            controls.dispose();
        };
    }, [props.gameState.gameSessionId]);
    
};
