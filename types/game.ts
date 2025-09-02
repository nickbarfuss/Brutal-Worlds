
import { Vector3 } from 'three';
import { GAME_CONFIG } from '../data/config';
import { WorldProfile, DisasterProfile, OrderProfile, VfxProfile, SemanticColorPalette } from './profiles';

export * from './profiles';

// Core Types
export type PlayerIdentifier = 'player-1' | 'player-2';
export type Player = PlayerIdentifier;
export type Owner = PlayerIdentifier | null;
export type AudioChannel = 'fx' | 'ambient' | 'music' | 'ui';

// UI & Interaction Types
export type HighlightType = 'domains' | 'enclaves' | 'expanses' | 'rifts';

export interface ActiveHighlight {
  type: HighlightType;
  owners: Set<Owner>;
}

export interface ScreenPosition {
  x: number;
  y: number;
  visible: boolean;
}

// Refactor the IntroStep type to match the new, user-defined cinematic sequence.
export type IntroStep = 'warp' | 'zoom' | 'reveal' | 'none';
export type GamePhase = 'loading' | 'mainMenu' | 'archetypeSelection' | 'playing' | 'gameOver';
export type GameOverState = 'none' | 'victory' | 'defeat';
export type InspectedEntity = { type: 'enclave' | 'rift' | 'expanse'; id: number } | { type: 'world' };

// Map & World Entity Types (Stateful parts)
export interface MapCell {
  id: number;
  polygon: any; 
  center: Vector3;
  neighbors: number[];
  type: 'void' | 'area';
  domainId: number | null;
  voidId: number | null;
  voidType: 'rift' | 'expanse' | null;
  enclaveId: number | null;
  owner: Owner;
  baseMaterialIndex: number;
  geometryGroupIndex: number;
}

export interface Enclave {
  id: number;
  name: string;
  owner: Owner;
  forces: number;
  center: Vector3;
  domainId: number;
  activeEffects: ActiveEffect[];
  vfxToPlayThisTurn: string[];
  sfxToPlayThisTurn?: string[];
  archetypeKey?: string;
  imageUrl: string;
}

export interface Domain {
  id: number;
  name: string;
  isIsland: boolean;
  center: Vector3;
  strength: number;
}

export interface Rift {
  id: number;
  name: string;
  center: Vector3;
  description: string;
}

export interface Expanse {
  id: number;
  name: string;
  center: Vector3;
  description: string;
}

export interface Route {
  from: number;
  to: number;
  type: 'land' | 'sea';
  disabledForTurns: number;
  isDestroyed: boolean;
}

// Orders & Commands
export type OrderType = 'attack' | 'assist' | 'holding';

export interface Order {
  to: number;
  type: OrderType;
}

export interface PendingOrders {
  [fromId: number]: Order;
}

// Disasters & Effects (Stateful parts)
export type DisasterTarget = 'Expanse' | 'Enclave' | 'Domain' | 'Global' | 'Path';

export type EffectRules =
  | { type: 'forceDamage'; percentage?: number; amount?: number | (() => number); targets?: () => number; radius?: () => number; routeDestructionChance?: number; routeDisruptionChance?: number; routeDisruptionDuration?: number; }
  | { type: 'routeDisruption' }
  | { type: 'forceDisruption'; productionReduction?: number; combatReduction?: number; radius?: (impactRadius: number) => number; randomRouteDisruption?: boolean }
  | { retriggerChance?: number }
  | {};

export interface ActiveEffect {
  id: string;
  profileKey: string;
  icon: string;
  duration: number;
  maxDuration: number;
  phase: 'alert' | 'impact' | 'aftermath';
  rules?: EffectRules;
  metadata?: any;
}

export interface ActiveDisasterMarker {
  id:string;
  profileKey: string;
  icon: string;
  position: Vector3;
  duration: number;
  targetEnclaveIds: number[];
  metadata?: any;
}

// VFX (Stateful)
export interface ActiveVfx {
  key: string;
  sheet: VfxProfile & { image: HTMLImageElement };
  worldPosition: Vector3;
  currentFrame: number;
  lastFrameTime: number;
}

// Gambits (Stateful)
export type GambitState = 'locked' | 'available' | 'active' | 'depleted';
export interface ActiveGambit {
    key: string;
    state: GambitState;
    remainingUses: number;
    remainingDuration?: number;
}

// Briefing
export interface BriefingContent {
    icon: string;
    iconColorClass?: string;
    iconColorHex?: string;
    title: string;
    subtitle?: string;
    description?: string;
    disasterDescription?: string;
    effect?: string;
    alertPhase?: { name: string; effect: string; duration: string };
    impactPhase?: { name: string; effect: string; duration: string };
    aftermathPhase?: { name: string; effect: string; duration: string };
    birthright?: { name: string; icon: string; effect: string };
    details?: { label: string; value: string }[];
    enclaves?: { id: number; name: string; forces: number; owner: Owner }[];
    value?: string | number;
    valueType?: 'force' | 'duration';
    owner?: Owner;
    worldPalette?: SemanticColorPalette;
    ownerForces?: { owner: Owner; forces: number }[];
    isContested?: boolean;
    enclavesByOwner?: { [owner: string]: Array<{ id: number; name: string; forces: number; owner: Owner }> };
}

export interface MaterialProperties {
    metalness: number;
    roughness: number;
    emissiveIntensity?: number;
}

// Game State Aggregate
type GameConfig = typeof GAME_CONFIG;

export interface GameState {
    mapData: MapCell[];
    enclaveData: { [id: number]: Enclave };
    domainData: { [id: number]: Domain };
    riftData: { [id: number]: Rift };
    expanseData: { [id: number]: Expanse };
    routes: Route[];
    planetName: string;
    isInitialized: boolean;
    error: string | null;
    currentTurn: number;
    pendingOrders: PendingOrders;
    latestDisaster: { profile: DisasterProfile; locationName: string } | null;
    activeDisasterMarkers: ActiveDisasterMarker[];
    loadingMessage: string;
    currentWorld: WorldProfile | null;
    gameConfig: GameConfig;
    gamePhase: GamePhase;
    gameSessionId: number;
    playerArchetypeKey: string | null;
    playerArchetypeSkinIndex: number | null;
    opponentArchetypeKey: string | null;
    opponentArchetypeSkinIndex: number | null;
    playerGambits: ActiveGambit[];
    opponentGambits: ActiveGambit[];
    hoveredCellId: number;
    selectedEnclaveId: number | null;
    inspectedEntity: InspectedEntity | null;
    isCardVisible: boolean;
    isIntroComplete: boolean;
    introStep: IntroStep;
    cameraFocusAnimation: { active: boolean; target: Vector3 } | null;
    hoveredEntity: any;
    isPaused: boolean;
    isResolvingTurn: boolean;
    gameOverState: GameOverState;
    initialCameraTarget: Vector3 | null;
    vfxToPlay?: { key: string; center: Vector3 } | null;
    sfxToPlay?: string | null;
    activeHighlight: ActiveHighlight | null;
    isSettingsOpen: boolean;
    volumes: Record<AudioChannel, number>;
    mutedChannels: Record<AudioChannel, boolean>;
    isBloomEnabled: boolean;
    bloomSettings: {
        threshold: number;
        strength: number;
        radius: number;
    };
    materialSettings: {
        player: MaterialProperties;
        neutral: MaterialProperties;
        void: MaterialProperties;
    };
    ambientLightIntensity: number;
    tonemappingStrength: number;
}