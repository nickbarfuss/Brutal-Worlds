import { WorldProfile, WorldColorTheme, SemanticColorPalette } from '../types/profiles';
import { generateColorScale } from '../utils/color';

// ====================================================================================
// WORLD LIBRARY
// ====================================================================================

const STANDARD_CONFIG = {
    seed: 0, SPHERE_RADIUS: 10, NUM_POINTS: 1500, LAND_COVERAGE_MIN: 0.25, LAND_COVERAGE_MAX: 0.50,
    ISLAND_DOMAINS_MIN: 1, ISLAND_DOMAINS_MAX: 3,
    ENCLAVE_SIZE_MIN: 8, ENCLAVE_SIZE_MAX: 15, RIFT_THRESHOLD: 50, EXPANSE_MAX_SIZE: 300,
    EXPANSE_COUNT_MIN: 1, EXPANSE_COUNT_MAX: 5,
    DOMAIN_TOUCH_CHANCE: 0.25, PENINSULA_CHANCE: 0.35,
};

const placeholderIllustration = 'https://storage.googleapis.com/brutal-worlds/backdrop/main.jpg';

// Define a type for our raw data objects, allowing illustrationUrl to be optional
type WorldDataObject = Omit<WorldProfile, 'worldColorTheme' | 'illustrationUrl' | 'neutralColorPalette'> & {
    illustrationUrl?: string;
};

const worldData: WorldDataObject[] = [
    // --- Standard Worlds ---
    { 
        key: 'xylos', name: 'Xylos Prime', icon: 'globe',
        description: "Lush forests and sprawling plains define this world, where strategic positioning on its balanced landmasses is key to victory.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Xylos-Prime.jpg',
        config: { ...STANDARD_CONFIG, seed: 101 },
        disasterChance: 0.15,
        possibleDisasters: ['skyfall-shards', 'resonance-cascade'],
        nebula: {
            main: { color: '#14532d', density: 0.45, falloff: 3.8 },
            wispy: { color: '#0d9488', density: 0.4, falloff: 4.2 }
        },
        sunColor: '#fef08a',
        sunScale: 60.0,
        worldColor: '#2dd4bf', // teal-400
        atmosphereColor: '#67e8f9',
        names: {
            domains: [
                { name: "Viridian Continent", strength: 6, enclaves: [{ name: "Green Spire" }, { name: "Riverbend" }, { name: "Emerald Heart" }, { name: "The Jade Citadel" }, { name: "Moss-Glen" }, { name: "Thornwall" }, { name: "The Elder Bough" }, { name: "Veridian Rise" }, { name: "The Stillwater Grove" }, { name: "Sylvan Cradle" }, { name: "The Bloom" }, { name: "Willow Creek" }] },
                { name: "The Elderwood", strength: 8, enclaves: [{ name: "Root-Hold" }, { name: "Whispering Boughs" }, { name: "The Oaken Gate" }, { name: "Gnarled Sanctum" }, { name: "Heartwood" }, { name: "The Great Deku" }, { name: "The Forest Crown" }, { name: "Sylvan Watch" }, { name: "The Ironwood" }, { name: "The Gloomwood" }, { name: "Elder-Throne" }] },
                { name: "Sunpetal Isles", strength: 4, enclaves: [{ name: "Sunken Bloom" }, { name: "The Glade" }, { name: "Golden Fields" }, { name: "Lily Pad Cove" }, { name: "The Petal Shore" }, { name: "Brightwater" }, { name: "First Light" }, { name: "Coral Point" }] },
                { name: "The Verdant Reach", strength: 7, enclaves: [{ name: "Canopy Citadel" }, { name: "Amberleaf" }, { name: "The Hanging Gardens" }, { name: "Treetop Village" }, { name: "The Green Vein" }, { name: "The Overgrowth" }, { name: "The Vine-Tangle" }, { name: "The Moss-Throne" }] },
                { name: "Whispering Plains", strength: 5, enclaves: [{ name: "Grass-Watch" }, { name: "Stone-Circle" }, { name: "The Old Meadow" }, { name: "Wind-Shear" }, { name: "The Lonely Barrow" }, { name: "The High Prairie" }, { name: "The Long Grass" }] }
            ],
            rifts: ["Silent Pool", "Sunken Fen", "Deepwood Scar", "Stillwater Rift", "The Green Chasm"],
            expanses: ["The Great Emerald Ocean", "Sea of Reeds", "Veridian Abyss", "The Tranquil Sea"]
        }
    },
    { 
        key: 'aetheria-tor', name: 'Aetheria-Tor', icon: 'globe',
        description: "A world of empires, where vast kingdoms clash across sprawling, interconnected continents. Control of the central landmass means control of the world.",
        bloom: {
            threshold: 0.63,
            strength: 0.50,
            radius: 1.0,
        },
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Aetheria-Tor.jpg',
        config: { ...STANDARD_CONFIG, seed: 202, DOMAIN_TOUCH_CHANCE: 0.6 },
        disasterChance: 0.15,
        possibleDisasters: ['entropy-wind', 'resonance-cascade'],
        nebula: {
            main: { color: '#1e3a8a', density: 0.38, falloff: 4.0 },
            wispy: { color: '#f59e0b', density: 0.4, falloff: 4.5 }
        },
        sunColor: '#fcd34d',
        sunScale: 70.0,
        worldColor: '#60a5fa', // blue-400
        atmosphereColor: '#fcd34d',
        names: {
            domains: [
                { name: "Wessex", strength: 9, enclaves: [{ name: "Stonehaven" }, { name: "Shield Islands" }, { name: "Old Sarum" }, { name: "The White Cliffs" }, { name: "Glastonbury" }, { name: "Camelot" }, { name: "The King's Moot" }, { name: "Exeter" }, { name: "The Solent" }] },
                { name: "Northumbria", strength: 7, enclaves: [{ name: "Raven's Perch" }, { name: "Wolf's Crag" }, { name: "Hadrian's Wall" }, { name: "Lindisfarne" }, { name: "Eboracum" }, { name: "The Cheviot Hills" }, { name: "Bamburgh" }, { name: "The Tyne" }] },
                { name: "Mercia", strength: 8, enclaves: [{ name: "Ironwood Citadel" }, { name: "The Saltmarshes" }, { name: "Tamworth" }, { name: "Lichfield" }, { name: "The Black Country" }, { name: "Sherwood" }, { name: "The Peak" }, { name: "The Trent" }] },
                { name: "East Anglia", strength: 6, enclaves: [{ name: "Ebon Caster" }, { name: "Dunwich Hold" }, { name: "Sutton Hoo" }, { name: "The Fens" }, { name: "The Broads" }, { name: "Norwich" }] },
                { name: "Kent", strength: 5, enclaves: [{ name: "Old Keep" }, { name: "Canterbury" }, { name: "Dover" }, { name: "The Weald" }, { name: "Rochester" }] },
                { name: "The Danelaw", strength: 10, enclaves: [{ name: "Jorvik" }, { name: "The Five Boroughs" }, { name: "Grimsby" }, { name: "The Humber" }, { name: "The Wash" }, { name: "Lincoln" }, { name: "Stamford" }] }
            ],
            rifts: ["The King's Fissure", "The Sunken Fens", "Drowned Reach", "Grendel's Mire"],
            expanses: ["The Northern Sea", "The Western Deep", "The Serpent's Teeth", "Whale Road"]
        }
    },
    { 
        key: 'grid-zero', name: 'Magentron', icon: 'globe',
        description: "A planet shattered into a vast archipelago. Naval superiority and control over the countless islands of Magentron are the only paths to global domination.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Magnetron.jpg',
        config: { ...STANDARD_CONFIG, seed: 303, ISLAND_DOMAINS_MIN: 3, ISLAND_DOMAINS_MAX: 5 },
        disasterChance: 0.20,
        possibleDisasters: ['ion-tempest', 'skyfall-shards'],
        nebula: {
            main: { color: '#86198f', density: 0.4, falloff: 5.0 },
            wispy: { color: '#22d3ee', density: 0.35, falloff: 3.8 }
        },
        sunColor: '#67e8f9',
        sunScale: 55.0,
        worldColor: '#ec4899', // pink-500
        atmosphereColor: '#a5b4fc',
        names: {
            domains: [
                { name: "The Mainframe", strength: 12, enclaves: [{ name: "Neo-Kyoto" }, { name: "Data-Spire" }, { name: "Arcology-5" }, { name: "The Core" }, { name: "System-Zero" }, { name: "The Hub" }, { name: "Megastructure-7" }, { name: "The Central Processor" }, { name: "The I/O Port" }] },
                { name: "Sector Iota", strength: 6, enclaves: [{ name: "Blacksite 7" }, { name: "Aegis Perimeter" }, { name: "The Firewall" }, { name: "Quarantine Zone" }, { name: "The Relay" }, { name: "The Black Box" }] },
                { name: "The Sub-Net Archipelago", strength: 4, enclaves: [{ name: "The Static Mire" }, { name: "Chrome-Docks" }, { name: "The Server Farm" }, { name: "Node-Point 3" }, { name: "The Cache" }] },
                { name: "Data Haven Isles", strength: 5, enclaves: [{ name: "Sector 7G" }, { name: "The Archive" }, { name: "The Mirror" }, { name: "The Backup" }, { name: "The Cold Storage" }] },
                { name: "The Glitch Fields", strength: 8, enclaves: [{ name: "The Gridfall Sprawl" }, { name: "Cyberia Plex" }, { name: "The Render Farm" }, { name: "The Voxel Pits" }, { name: "The Wire-Jungle" }, { name: "The Bit-Stream" }, { name: "The Corrupted Sector" }] }
            ],
            rifts: ["The Datastream Gap", "Glitch-Flow", "The Firewall Rift", "Null-Zone"],
            expanses: ["The Data-Phage Sea", "The Great Nothing", "The Endless Stream", "The Black ICE"]
        }
    },

    // --- Large Worlds ---
    { 
        key: 'war-world', name: 'War-World', icon: 'globe',
        description: "There is only war. This massive super-continent is a brutal meat grinder where front lines shift constantly and only the most aggressive commander can claim victory.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/War-World.jpg',
        config: { ...STANDARD_CONFIG, seed: 505, NUM_POINTS: 2200, LAND_COVERAGE_MIN: 0.5, LAND_COVERAGE_MAX: 0.6, ISLAND_DOMAINS_MIN: 0, ISLAND_DOMAINS_MAX: 1, ENCLAVE_SIZE_MIN: 12, ENCLAVE_SIZE_MAX: 20, DOMAIN_TOUCH_CHANCE: 0.8 },
        disasterChance: 0.25,
        possibleDisasters: ['skyfall-shards', 'pyroclasm', 'resonance-cascade'],
        nebula: {
            main: { color: '#7f1d1d', density: 0.55, falloff: 3.5 },
            wispy: { color: '#451a03', density: 0.45, falloff: 4.0 }
        },
        sunColor: '#fef9c3',
        sunScale: 90.0,
        worldColor: '#f97316', // orange-500
        atmosphereColor: '#fca5a5',
        names: {
            domains: [
                { name: "The Shattered Spine", strength: 10, enclaves: [{ name: "Goliath's Fall" }, { name: "The Breach" }, { name: "Titan's Rest" }, { name: "The High Pass" }, { name: "The Dragon's Teeth" }, { name: "The Giant's Causeway" }, { name: "World's End" }, { name: "The Great Chasm" }] },
                { name: "The Iron Dominion", strength: 12, enclaves: [{ name: "Bastion" }, { name: "The Citadel" }, { name: "The War-Forge" }, { name: "The Armory" }, { name: "The Bulwark" }, { name: "The Last Wall" }, { name: "The Gauntlet" }, { name: "The Garrison" }, { name: "The Keep" }] },
                { name: "Savage Reach", strength: 8, enclaves: [{ name: "Iron Tusk Fort" }, { name: "The Rad-Wastes" }, { name: "The Beast's Lair" }, { name: "The Hunting Grounds" }, { name: "The Feral Wilds" }, { name: "The Badlands" }, { name: "The Savage Coast" }] },
                { name: "The Killing Fields", strength: 11, enclaves: [{ name: "Forward Base Zero" }, { name: "The Blood Pits" }, { name: "No Man's Land" }, { name: "The Trench" }, { name: "The Redoubt" }, { name: "The Salient" }, { name: "The Wire" }, { name: "The Front Line" }] },
                { name: "Ashen Expanse", strength: 9, enclaves: [{ name: "Scrap-Heap Throne" }, { name: "The Bone Fields" }, { name: "The Dust Bowl" }, { name: "The Grey Waste" }, { name: "The Cinder Plains" }, { name: "The Ashlands" }, { name: "The Smog" }] }
            ],
            rifts: ["The Great Scar", "The Dead Chasm", "The Rust-Stained Rift", "No Man's Land"],
            expanses: ["The Crimson Void", "Sea of Scrap", "The Savage Abyss", "The Rust-Burn Deeps"]
        }
    },
    { 
        key: 'hephaestus-iv', name: 'Anvillar', icon: 'globe',
        description: "Two titanic continents are locked in an eternal struggle. The narrow sea between them is the primary battleground for this world's fate.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Anvillar.jpg',
        bloom: {
            threshold: 0.33,
            strength: 1.40,
            radius: 1.0,
        },
        config: { ...STANDARD_CONFIG, seed: 606, NUM_POINTS: 2000, LAND_COVERAGE_MIN: 0.45, LAND_COVERAGE_MAX: 0.55, ISLAND_DOMAINS_MIN: 0, ISLAND_DOMAINS_MAX: 0, ENCLAVE_SIZE_MIN: 15, ENCLAVE_SIZE_MAX: 25 },
        disasterChance: 0.22,
        possibleDisasters: ['pyroclasm', 'resonance-cascade'],
        nebula: {
            main: { color: '#4a044e', density: 0.5, falloff: 3.0 },
            wispy: { color: '#737373', density: 0.6, falloff: 4.5 }
        },
        sunColor: '#fda4af',
        sunScale: 100.0,
        worldColor: '#e11d48', // rose-600
        atmosphereColor: '#a21caf',
        names: {
            domains: [
                { name: "The Great Forge", strength: 15, enclaves: [{ name: "Prometheus Spire" }, { name: "The Anvil" }, { name: "Daedalus Works" }, { name: "The Foundry" }, { name: "The Hearth" }, { name: "The Kiln" }, { name: "The Bloomery" }, { name: "The Bellows" }, { name: "The Slag Pit" }, { name: "The Fire Mountain" }] },
                { name: "The Colossus", strength: 15, enclaves: [{ name: "Hades Gate" }, { name: "The Chimera Pits" }, { name: "Argus Array" }, { name: "The Cyclopes' Yard" }, { name: "Styx Crossing" }, { name: "Tartarus Deep" }, { name: "The Labyrinth" }, { name: "The Hundred-Handed" }, { name: "The Titan's Grip" }, { name: "The Underworld" }] }
            ],
            rifts: ["The Tartarus Rift", "The Acheron Gap", "The Lethe Fissure"],
            expanses: ["The Stygian Sea", "The Aegean Abyss", "Oceanus Prime"]
        }
    },
    { 
        key: 'rusted-mars', name: 'Skull-Sands', icon: 'globe',
        description: "A vast desert world where life clings to a few sparse continents. Resources are scarce, and control of the few fertile areas is paramount.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Skull-Sands.jpg',
        config: { ...STANDARD_CONFIG, seed: 808, NUM_POINTS: 2100, LAND_COVERAGE_MIN: 0.20, LAND_COVERAGE_MAX: 0.30 },
        disasterChance: 0.18,
        possibleDisasters: ['entropy-wind', 'skyfall-shards'],
        nebula: {
            main: { color: '#78350f', density: 0.3, falloff: 4.8 },
            wispy: { color: '#a16207', density: 0.35, falloff: 5.0 }
        },
        sunColor: '#fefce8',
        sunScale: 80.0,
        worldColor: '#ca8a04', // yellow-600
        atmosphereColor: '#fed7aa',
        names: {
            domains: [
                { name: "The Great Aridity", strength: 7, enclaves: [{ name: "Terminus Outpost" }, { name: "Lookout Point" }, { name: "The Last Oasis" }, { name: "The Dry Well" }, { name: "The Sun-Stone" }, { name: "The Salt-Pan" }, { name: "The Bleached Bones" }] },
                { name: "The Red Wastes", strength: 6, enclaves: [{ name: "The Rust-Hulk Concourse" }, { name: "Redstone" }, { name: "The Iron-Oxide Flats" }, { name: "The Crimson Dune" }, { name: "The Ochre Plains" }] },
                { name: "The Salt Flats", strength: 5, enclaves: [{ name: "The Salt Mine" }, { name: "The Watering Hole" }, { name: "The Brine Pool" }, { name: "The White Pan" }, { name: "The Crystal Beds" }] },
                { name: "The Canyonlands", strength: 8, enclaves: [{ name: "The Badlands Fort" }, { name: "The Scrap-Yard" }, { name: "The Mesa" }, { name: "The Gulch" }, { name: "The Hoodoos" }, { name: "The Arroyo" }] },
                { name: "The Dust Bowl", strength: 4, enclaves: [{ name: "The Dust-Devil" }, { name: "The Sand-Sea" }, { name: "The Empty Quarter" }, { name: "The Shifting Sands" }] }
            ],
            rifts: ["The Great Divide", "The Dry Gulch", "The Salt Scar"],
            expanses: ["The Dust Ocean", "The Sea of Red Sand", "The Salt Abyss"]
        }
    },

    // --- Small Worlds ---
    { 
        key: 'solitude', name: 'Grave-Star', icon: 'globe',
        description: "Lost in the silent void, Grave-Star is a collection of desolate islands. Conflict here is a quiet, lonely affair, fought over the last remnants of a forgotten world.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Grave-Star.jpg',
        config: { ...STANDARD_CONFIG, seed: 909, NUM_POINTS: 800, LAND_COVERAGE_MIN: 0.15, LAND_COVERAGE_MAX: 0.25, ISLAND_DOMAINS_MIN: 4, ISLAND_DOMAINS_MAX: 6 },
        disasterChance: 0.10,
        possibleDisasters: ['void-surge', 'entropy-wind'],
        nebula: {
            main: { color: '#1f2937', density: 0.25, falloff: 3.2 },
            wispy: { color: '#e5e7eb', density: 0.3, falloff: 4.0 }
        },
        sunColor: '#e0f2fe',
        sunScale: 50.0,
        worldColor: '#9ca3af', // gray-400
        atmosphereColor: '#e5e7eb',
        names: {
            domains: [
                { name: "The Silent Archipelago", strength: 3, enclaves: [{ name: "Last Light" }, { name: "The Lonely Watch" }, { name: "The Final Port" }, { name: "The Stillwater" }] },
                { name: "The Forgotten Isles", strength: 4, enclaves: [{ name: "The Refuge" }, { name: "The Last Harbor" }, { name: "The Hidden Cove" }, { name: "The Grey Shoal" }] },
                { name: "The Last Remnant", strength: 5, enclaves: [{ name: "The Silent Fort" }, { name: "The Grey Tower" }, { name: "The Stone Beacon" }, { name: "The Watcher's Peak" }] },
                { name: "The Empty Quarter", strength: 2, enclaves: [{ name: "The Echoing Cave" }, { name: "The Barren Rock" }, { name: "The Salt-Spray" }] },
                { name: "The Ghost Cays", strength: 3, enclaves: [{ name: "The Grey Beach" }, { name: "The Wreckage" }, { name: "The Ship-Trap" }] }
            ],
            rifts: ["The Silent Chasm", "The Empty Passage", "The Still Rift"],
            expanses: ["The Sea of Silence", "The Endless Grey", "The Unbeating Ocean"]
        }
    },
    { 
        key: 'terminus', name: 'Blade\'s Edge', icon: 'globe',
        description: "Small and brutal, Blade's Edge offers no room for grand strategy. Conflicts are swift, bloody, and decisive on this compact battlefield.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Blades-Edge.jpg',
        bloom: {
            threshold: 0.27,
            strength: 1.08,
            radius: 1.0,
        },
        config: { ...STANDARD_CONFIG, seed: 1010, NUM_POINTS: 750, LAND_COVERAGE_MIN: 0.4, LAND_COVERAGE_MAX: 0.5, ISLAND_DOMAINS_MIN: 0, ISLAND_DOMAINS_MAX: 1, ENCLAVE_SIZE_MIN: 10, ENCLAVE_SIZE_MAX: 18 },
        disasterChance: 0.25,
        possibleDisasters: ['skyfall-shards', 'resonance-cascade'],
        nebula: {
            main: { color: '#450a0a', density: 0.48, falloff: 4.5 },
            wispy: { color: '#4b5563', density: 0.4, falloff: 3.8 }
        },
        sunColor: '#f87171',
        sunScale: 85.0,
        worldColor: '#dc2626', // red-600
        atmosphereColor: '#4b5563',
        names: {
            domains: [
                { name: "The Final Frontier", strength: 8, enclaves: [{ name: "The Last Bastion" }, { name: "Point of No Return" }, { name: "The Gauntlet" }, { name: "The Last Stand" }, { name: "The Terminus" }] },
                { name: "The Omega Continent", strength: 9, enclaves: [{ name: "The Final Redoubt" }, { name: "The Abyss Watch" }, { name: "The End-Line" }, { name: "The Last Hope" }] },
                { name: "The Last Stand", strength: 10, enclaves: [{ name: "The Killing Ground" }, { name: "The Precipice" }, { name: "The Breaker's Yard" }, { name: "The Final Gate" }, { name: "The Brink" }] }
            ],
            rifts: ["The Final Crack", "The Oblivion Rift", "The Sundering"],
            expanses: ["The Sea of Endings", "The Final Void", "The Unmaking Deep"]
        }
    },
    { 
        key: 'cygnus-x1', name: 'Cygnus X-1', icon: 'globe',
        description: "This dense cluster of islands is a tactician's dream, demanding mastery of naval routes and amphibious assaults to achieve victory.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Cygnus-X-1.jpg',
        config: { ...STANDARD_CONFIG, seed: 1212, NUM_POINTS: 850, LAND_COVERAGE_MIN: 0.25, LAND_COVERAGE_MAX: 0.35, ISLAND_DOMAINS_MIN: 6, ISLAND_DOMAINS_MAX: 10 },
        disasterChance: 0.20,
        possibleDisasters: ['void-surge', 'ion-tempest', 'skyfall-shards'],
        nebula: {
            main: { color: '#164e63', density: 0.42, falloff: 3.9 },
            wispy: { color: '#0891b2', density: 0.35, falloff: 4.1 }
        },
        sunColor: '#bae6fd',
        sunScale: 110.0,
        worldColor: '#06b6d4', // cyan-500
        atmosphereColor: '#60a5fa',
        names: {
            domains: [
                { name: "The Nebula Cluster", strength: 4, enclaves: [{ name: "The Singularity" }, { name: "The Accretion Disc" }, { name: "The Stellar Nursery" }] },
                { name: "The Ring Archipelago", strength: 5, enclaves: [{ name: "The Lagrange Point" }, { name: "The Clarke Orbit" }, { name: "The Shepherd Moon" }] },
                { name: "The Event Horizon", strength: 6, enclaves: [{ name: "Zero-G Point" }, { name: "The Dyson Sphere Fragment" }, { name: "The Penrose Steps" }] },
                { name: "The Starfall Islands", strength: 3, enclaves: [{ name: "The Star-Dock" }, { name: "The Roche Limit" }, { name: "The Impact Crater" }] },
                { name: "The Kuiper Belt", strength: 5, enclaves: [{ name: "The Comet's Tail" }, { name: "The Oort Cloud Outpost" }, { name: "The Ice-Field" }] }
            ],
            rifts: ["The Gravity Well", "The Dark Rift", "The Stellar Nursery"],
            expanses: ["The Interstellar Void", "The Dark Matter Sea", "The Cosmic Ocean"]
        }
    },
    
    // --- Unique Worlds ---
    { 
        key: 'cinder-sphere', name: 'Magma-Tor', icon: 'globe',
        description: "A world of fire and water where chains of volcanic islands dot a boiling sea. Survival, let alone conquest, requires adapting to its extreme and volatile environment.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Magma-Tor.jpg',
        config: { ...STANDARD_CONFIG, seed: 1313, LAND_COVERAGE_MIN: 0.10, LAND_COVERAGE_MAX: 0.18, ISLAND_DOMAINS_MIN: 10, ISLAND_DOMAINS_MAX: 15 },
        disasterChance: 0.30,
        possibleDisasters: ['pyroclasm'],
        nebula: {
            main: { color: '#7f1d1d', density: 0.5, falloff: 3.7 },
            wispy: { color: '#1f2937', density: 0.35, falloff: 4.4 }
        },
        sunColor: '#fde047',
        sunScale: 88.0,
        worldColor: '#ea580c', // orange-600
        atmosphereColor: '#b91c1c',
        names: {
            domains: [
                { name: "The Ashen Isles", strength: 7, enclaves: [{ name: "The Ashfall Citadel" }, { name: "The Soot-Shrouded Port" }, { name: "The Ember-Shore" }] },
                { name: "The Magma Fields", strength: 9, enclaves: [{ name: "The Magma-Forge" }, { name: "The Lava-Flow" }, { name: "The Fire-Peak" }] },
                { name: "The Obsidian Archipelago", strength: 6, enclaves: [{ name: "The Obsidian Spire" }, { name: "The Glass Beach" }, { name: "The Razor-Rock" }] },
                { name: "The Soot-Stained Isles", strength: 5, enclaves: [{ name: "The Cinder Cone" }, { name: "The Fumarole" }, { name: "The Black-Sand" }] },
                { name: "The Caldera Chain", strength: 8, enclaves: [{ name: "The Caldera Keep" }, { name: "The Pumice Beach" }, { name: "The Sulfur Vent" }] }
            ],
            rifts: ["The Lava Tube", "The Ash-Choked Chasm", "The Fissure of Flame"],
            expanses: ["The Boiling Sea", "The Sea of Ash", "The Molten Ocean"]
        }
    },
    { 
        key: 'shattered-core', name: 'Shatter-Spire', icon: 'globe',
        description: "The fractured surface of Shatter-Spire is a chaotic mess of tiny, defensible enclaves. Warfare is a granular affair, won one shard at a time.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Shatter-Spire.jpg',
        config: { ...STANDARD_CONFIG, seed: 1414, NUM_POINTS: 1800, ENCLAVE_SIZE_MIN: 4, ENCLAVE_SIZE_MAX: 8 },
        disasterChance: 0.28,
        possibleDisasters: ['resonance-cascade', 'entropy-wind'],
        nebula: {
            main: { color: '#4c1d95', density: 0.35, falloff: 5.5 },
            wispy: { color: '#e0e7ff', density: 0.45, falloff: 4.8 }
        },
        sunColor: '#f5f3ff',
        sunScale: 75.0,
        worldColor: '#a78bfa', // violet-400
        atmosphereColor: '#e0e7ff',
        names: {
            domains: [
                { name: "The Crystal Archipelago", strength: 4, enclaves: [{ name: "The Crystal Spire" }, { name: "The Gleaming Point" }, { name: "The Refracting Isles" }] },
                { name: "The Shard-Lands", strength: 5, enclaves: [{ name: "The Shard-Fortress" }, { name: "The Crystalline Heart" }, { name: "The Glass-Plains" }] },
                { name: "The Geode Isles", strength: 3, enclaves: [{ name: "The Geode City" }, { name: "The Hollow Rock" }, { name: "The Agate-Shore" }] },
                { name: "The Prism Plains", strength: 6, enclaves: [{ name: "The Prism-Watch" }, { name: "The Diamond-Dust Mines" }, { name: "The Light-Bender" }] },
                { name: "The Broken Core", strength: 5, enclaves: [{ name: "The Broken-Point" }, { name: "The Quartz Quarry" }, { name: "The Fracture" }] }
            ],
            rifts: ["The Shard-Rift", "The Crystal Chasm", "The Geode-Gap", "The Great Fracture"],
            expanses: ["The Sea of Shards", "The Crystal Sea", "The Prismatic Abyss"]
        }
    },
    { 
        key: 'iron-sphere', name: 'Steel-Spine', icon: 'globe',
        description: "Steel-Spine's serpentine continents create natural chokepoints and fortified borders. Victory is a matter of breaking through enemy lines and securing these vital passages.",
        illustrationUrl: 'https://storage.googleapis.com/brutal-worlds/world/Steel-Spine.jpg',
        config: { ...STANDARD_CONFIG, seed: 1616, NUM_POINTS: 1600, LAND_COVERAGE_MIN: 0.35, LAND_COVERAGE_MAX: 0.45, PENINSULA_CHANCE: 0.8, DOMAIN_TOUCH_CHANCE: 0.1 },
        disasterChance: 0.18,
        possibleDisasters: ['ion-tempest', 'resonance-cascade'],
        nebula: {
            main: { color: '#111827', density: 0.6, falloff: 3.3 },
            wispy: { color: '#374151', density: 0.3, falloff: 4.0 }
        },
        sunColor: '#e5e7eb',
        sunScale: 78.0,
        worldColor: '#6b7280', // gray-500
        atmosphereColor: '#fef08a',
        names: {
            domains: [
                { name: "The Iron Dominion", strength: 9, enclaves: [{ name: "The Iron Keep" }, { name: "The Anvil" }, { name: "The Great Smelter" }, { name: "The Ore-Vein" }, { name: "The Forge-Heart" }] },
                { name: "The Steel Peninsula", strength: 7, enclaves: [{ name: "The Steelworks" }, { name: "The Ore-Works" }, { name: "The Bridgehead" }, { name: "The Choke-Point" }, { name: "The Isthmus" }] },
                { name: "The Rust-Coasts", strength: 6, enclaves: [{ name: "The Rust-Port" }, { name: "The Chrome-Fang Ridge" }, { name: "The Oxidized Shore" }, { name: "The Salt-Stain" }] },
                { name: "The Slag Heaps", strength: 5, enclaves: [{ name: "The Slag-Fort" }, { name: "The Spoil-Tip" }, { name: "The Scrap-Pile" }] },
                { name: "The Titanium Chain", strength: 8, enclaves: [{ name: "The Titanium Mine" }, { name: "The Foundry" }, { name: "The Alloy-Works" }, { name: "The Adamant Spire" }] }
            ],
            rifts: ["The Black-Iron Gap", "The Slag-Rift", "The Rust-Trench"],
            expanses: ["The Mercury Sea", "The Black-Iron Deep", "The Sea of Slag"]
        }
    },
];

export const WORLD_LIBRARY: WorldProfile[] = worldData.map(world => {
    const scale = generateColorScale(world.worldColor);
    
    // With the new color scale where worldColor is the 500 shade,
    // we can create a more standard semantic mapping.
    const neutralPalette: SemanticColorPalette = {
        base: scale[700],      // Darker base for default state
        hover: scale[600],     // Brighter on hover
        target: scale[500],    // Even brighter for targeting
        selected: scale[500],  // Brightest for selection/accents (often the worldColor itself)
        light: scale[100],     // Lightest text/highlight color
        dark: scale[800],      // Darkest for backgrounds or void
        disabled: scale[800],  // Muted color for disabled states
        icon: scale[400],      // Bright and clear for icons
        text: scale[400],      // Same as icon for readability
    };
    
    const theme: WorldColorTheme = {
        scale,
        three: neutralPalette
    };

    return {
        ...(world as Omit<WorldProfile, 'worldColorTheme' | 'neutralColorPalette'>),
        illustrationUrl: world.illustrationUrl || placeholderIllustration,
        worldColorTheme: theme,
        neutralColorPalette: neutralPalette,
    };
});