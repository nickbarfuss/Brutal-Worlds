
import { DisasterProfile } from '../types/profiles';

export const DISASTER_PROFILES: { [key: string]: DisasterProfile } = {
    'void-surge': {
        ui: { name: "Void Surge", icon: 'cyclone', description: "A tear in reality unleashes a scouring wave of void energy from an Expanse." },
        logic: {
            target: 'Expanse',
            alert: { 
                name: "Rift Instability",
                description: "The void grows unstable, hinting at a powerful surge.",
                effect: "A Void Surge will impact this area next turn.",
                rules: {},
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "Void Lash",
                description: "A wave of pure void energy lashes out from the Expanse.",
                effect: "Destroys 50% of forces.",
                rules: { type: 'forceDamage', percentage: 0.5 },
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-void-surge-impact.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 },
                sfx: 'void-surge-impact'
            },
            aftermath: { 
                name: "Void Contamination",
                description: "Residual void energy contaminates the surrounding area.",
                effect: "All connected routes are disabled for the duration.",
                rules: { type: 'routeDisruption' },
                duration: [2, 3], 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-void-surge-aftermath.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 },
                sfx: 'void-surge-aftermath'
            }
        }
    },
    'resonance-cascade': {
        ui: { name: "Resonance Cascade", icon: 'earthquake', description: "The planetary core resonates violently, causing the ground to liquefy and shatter." },
        logic: {
            target: 'Enclave',
            alert: { 
                name: "Seismic Tremors",
                description: "Minor tremors suggest a major seismic event is building.",
                effect: "A Resonance Cascade will impact this area next turn.",
                rules: {},
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "Initial Shock",
                description: "A violent shockwave erupts from the planet's core.",
                effect: "Destroys 25% of forces.",
                rules: { 
                    type: 'forceDamage', 
                    percentage: 0.25,
                    radius: () => {
                        const rand = Math.random();
                        if (rand < 0.6) return 3;
                        if (rand < 0.9) return 6;
                        return 9;
                    }
                },
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-resonance-cascade-impact.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            aftermath: { 
                name: "Seismic Instability",
                description: "The ground remains unstable and treacherous.",
                effect: "Reduces production & attack effectiveness by 50%.",
                rules: { 
                    type: 'forceDisruption', 
                    productionReduction: 0.5, 
                    combatReduction: 0.5,
                    radius: (impactRadius) => impactRadius
                },
                duration: [3, 4], 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-resonance-cascade-aftermath.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            }
        }
    },
    'entropy-wind': {
        ui: { name: "Entropy Wind", icon: 'tornado', description: "A howling gale of pure chaos moves across the land, unmaking everything in its path." },
        logic: {
            target: 'Path', handler: 'moveEntropyWind',
            alert: { 
                name: "Chaotic Drafts",
                description: "Unnatural winds begin to blow, carrying whispers of entropy.",
                effect: "An Entropy Wind will impact this location next turn.",
                rules: {},
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "Unmaking Gale",
                description: "A howling gale of pure chaos rips through the enclave.",
                effect: "Destroys 50% of forces.",
                rules: { type: 'forceDamage', percentage: 0.5 },
                duration: 1
            },
            aftermath: { 
                name: "Lingering Gusts",
                description: "Lingering gusts of entropic energy seek a new target.",
                effect: "Has a 50% chance to move, applying impact to a new target. If it fails to move, destroys 25% of forces.",
                rules: { retriggerChance: 0.5 },
                duration: [2, 4]
            }
        }
    },
    'pyroclasm': {
        ui: { name: "Pyroclasm", icon: 'volcano', description: "A world-forge ignites, unleashing an eruption that blankets entire domains in ash." },
        logic: {
            target: 'Enclave',
            alert: { 
                name: "Pyroschizm",
                description: "A cataclysmic eruption is imminent in this location.",
                effect: "A Pyroclasm will impact this location next turn.",
                rules: {},
                duration: 1,
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "Pyroclastic Burst",
                description: "A superheated cloud of ash and rock explodes outwards.",
                effect: "Destroys 75% of forces.",
                rules: { type: 'forceDamage', percentage: 0.75, radius: () => Math.floor(Math.random() * 3) + 2.5 },
                duration: 1
            },
            aftermath: { 
                name: "Pyroclastic Shroud",
                description: "The sky is choked with a thick shroud of ash, blotting out the sun.",
                effect: "Halts all production for the duration.",
                rules: { type: 'forceDisruption', productionReduction: 1.0, radius: (impactRadius: number) => impactRadius + Math.floor(Math.random() * 2) + 1.5 },
                duration: [2, 4]
            }
        }
    },
    'ion-tempest': {
        ui: { name: "Ion Tempest", icon: 'bolt', description: "An overwhelming storm of electromagnetic energy blankets an entire domain." },
        logic: {
            target: 'Domain',
            alert: { 
                name: "Static Convergence",
                description: "The atmosphere crackles, signaling a massive electromagnetic storm is forming.",
                effect: "An Ion Tempest will impact this domain next turn.",
                rules: {},
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "EMP Burst",
                description: "A massive electromagnetic pulse shorts out battlefield systems.",
                effect: "Destroys 2-8 forces.",
                rules: { type: 'forceDamage', amount: () => Math.floor(Math.random() * 7) + 2 },
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-ion-tempest-impact.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            aftermath: { 
                name: "Ion Storm",
                description: "A lingering ion storm disrupts communications and logistics.",
                effect: "Reduces force generation by 50%. Each turn, a random connected route is disabled.",
                rules: { type: 'forceDisruption', productionReduction: 0.5, randomRouteDisruption: true },
                duration: [3, 5], 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-ion-tempest-aftermath.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            }
        }
    },
     'skyfall-shards': {
        ui: { name: "Skyfall Shards", icon: 'motion_blur', description: "De-orbiting debris becomes a kinetic weapon, striking multiple enclaves." },
        logic: {
            target: 'Global',
            alert: { 
                name: "Orbital Decay",
                description: "Orbital debris signatures are detected, signaling an imminent kinetic strike.",
                effect: "A kinetic strike will impact this location next turn.",
                rules: {},
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/alert-disaster.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            impact: { 
                name: "Kinetic Strike",
                description: "Tungsten shards, accelerated to orbital velocity, impact the surface.",
                effect: "Destroys 10 forces. Has a 25% chance to disable connected routes for 1 turn.",
                rules: { type: 'forceDamage', amount: 10, routeDisruptionChance: 0.25, routeDisruptionDuration: 1, targets: () => Math.floor(Math.random() * 6) + 5 },
                duration: 1, 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-skyfall-shards-impact.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            },
            aftermath: { 
                name: "Radiation Sickness",
                description: "The impact sites are contaminated with hazardous radiation from the shards' cores.",
                effect: "Destroys 1 force.",
                rules: { type: 'forceDamage', amount: 1 },
                duration: [2, 3], 
                vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/disaster-skyfall-shards-aftermath.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
            }
        }
    }
};
