import { ArchetypeProfile } from '../types/profiles';

export const ARCHETYPES: { [key: string]: ArchetypeProfile } = {
    'first-sword': {
        key: 'first-sword',
        name: "First Sword",
        focus: ["Aggression", "Domination", "Unstoppable"],
        icon: "swords",
        description: "A master of direct conflict and relentless expansion. The First Sword believes that true power is won through overwhelming military might, seeking to conquer the world through decisive, head-on assaults.",
        birthrightKey: 'kinetic-onslaught',
        gambitKeys: ['war-fulcrum', 'shatterpoint-strike'],
        skins: [
            {
                videoUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/first-sword-1.webm',
                imageUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/first-sword-1.jpg',
            },
            {
                videoUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/first-sword-2.webm',
                imageUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/first-sword-2.jpg',
            }
        ]
    },
    'pact-whisperer': {
        key: 'pact-whisperer',
        name: "Pact Whisperer",
        focus: ["Influence", "Coercion", "Manipulation"],
        icon: "mindfulness",
        description: "A sovereign of the unseen war, the Pact Whisperer wields influence as their primary weapon. They win not by breaking enclaves, but by bending them, turning enemies against each other and absorbing worlds.",
        birthrightKey: 'memetic-resonance',
        gambitKeys: ['incite-rebellion', 'void-embargo'],
        skins: [
            {
                videoUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/pact-whisperer-1.webm',
                imageUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/pact-whisperer-1.jpg',
            }
        ]
    },
    'world-artificer': {
        key: 'world-artificer',
        name: "World Artificer",
        focus: ["Building", "Fortification", "Innovation"],
        icon: "architecture",
        description: "An architect of empire and a master of defense. The World Artificer builds unbreakable foundations, winning through superior infrastructure, attrition, and the creation of impenetrable strongholds that outlast any siege.",
        birthrightKey: 'genesis-forge',
        gambitKeys: ['rapid-reinforcement', 'establish-supply-line'],
        skins: [
            {
                videoUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/world-artificer-1.webm',
                imageUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/world-artificer-1.jpg',
            }
        ]
    },
    'labyrinthine-ghost': {
        key: 'labyrinthine-ghost',
        name: "Labyrinthine Ghost",
        focus: ["Espionage", "Secrets", "Disruption"],
        icon: "hub",
        description: "A master of shadows and secrets who thrives on disruption. The Labyrinthine Ghost dismantles empires from within, using intelligence, sabotage, and covert operations to ensure their enemies defeat themselves.",
        birthrightKey: 'panopticon-web',
        gambitKeys: ['sabotage-route', 'counter-intelligence'],
        skins: [
            {
                videoUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/labyrinthine-ghost-1.webm',
                imageUrl: 'https://storage.googleapis.com/brutal-worlds/archetype/labyrinthine-ghost-1.jpg',
            }
        ]
    }
};