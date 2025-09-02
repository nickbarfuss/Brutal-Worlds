// Static Profiles & Configurations

// World Generation & Theming
export interface WorldConfig {
  seed: number;
  SPHERE_RADIUS: number;
  NUM_POINTS: number;
  LAND_COVERAGE_MIN: number;
  LAND_COVERAGE_MAX: number;
  ISLAND_DOMAINS_MIN: number;
  ISLAND_DOMAINS_MAX: number;
  ENCLAVE_SIZE_MIN: number;
  ENCLAVE_SIZE_MAX: number;
  RIFT_THRESHOLD: number;
  EXPANSE_MAX_SIZE: number;
  EXPANSE_COUNT_MIN: number;
  EXPANSE_COUNT_MAX: number;
  DOMAIN_TOUCH_CHANCE: number;
  PENINSULA_CHANCE: number;
}

export interface NebulaConfig {
  color: string;
  density: number;
  falloff: number;
}

export interface ColorScale {
  50: string; 100: string; 200: string; 300: string; 400: string;
  500: string; 600: string; 700: string; 800: string; 900: string; 950: string;
}

export interface SemanticColorPalette {
  base: string;
  hover: string;
  target: string;
  selected: string;
  light: string;
  dark: string;
  disabled: string;
  icon: string;
  text: string;
}

export interface WorldColorTheme {
  scale: ColorScale,
  three: SemanticColorPalette;
}

export interface WorldProfile {
  key: string;
  name: string;
  description: string;
  illustrationUrl: string;
  icon: string;
  config: WorldConfig;
  nebula: {
    main: NebulaConfig;
    wispy: NebulaConfig;
  };
  sunColor: string;
  sunScale: number;
  worldColor: string;
  atmosphereColor: string;
  worldColorTheme: WorldColorTheme;
  neutralColorPalette: SemanticColorPalette;
  names: {
    domains: {
      name: string;
      strength: number;
      enclaves: { name: string }[];
    }[];
    rifts: string[];
    expanses: string[];
  };
  possibleDisasters: string[];
  disasterChance: number;
  bloom?: {
    threshold: number;
    strength: number;
    radius: number;
  };
  tonemappingStrength?: number;
}

// Game Rules & Abilities
export interface OrderProfile {
    name: string;
    icon: string;
    description: string;
    effect: string;
    vfx?: VfxProfile;
}

interface DisasterPhase {
    name: string;
    description: string;
    effect: string;
    rules: any; // EffectRules
    duration: number | [number, number];
    vfx?: VfxProfile;
    sfx?: string;
}

export interface DisasterProfile {
  ui: {
    name: string;
    icon: string;
    description: string;
  };
  logic: {
    target: any; // DisasterTarget
    alert: Omit<DisasterPhase, 'duration'> & { duration: number };
    impact: Omit<DisasterPhase, 'duration'> & { duration: number };
    aftermath?: Omit<DisasterPhase, 'duration'> & { duration: [number, number] };
    handler?: string;
  };
}

export interface ArchetypeProfile {
    key: string;
    name: string;
    focus: string[];
    icon: string;
    description: string;
    birthrightKey: string;
    gambitKeys: string[];
    skins: {
        videoUrl: string;
        imageUrl: string;
    }[];
}

export interface BirthrightProfile {
    name: string;
    icon: string;
    description: string;
    effect: string;
}

export interface GambitProfile {
    key: string;
    name: string;
    icon: string;
    description: string;
    target: 'Player' | 'Opponent' | 'Neutral' | 'Global';
    category: 'Archetype' | 'Common';
    restriction: string;
    availabilityTurn: number;
    uses: number;
    effect: string;
}

// VFX
export interface VfxProfile {
    url: string;
    frameWidth: number;
    frameHeight: number;
    columns: number;
    totalFrames?: number;
    frameRate: number;
}