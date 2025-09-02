
import { BirthrightProfile } from '../types/profiles';

export const BIRTHRIGHTS: { [key: string]: BirthrightProfile } = {
    'kinetic-onslaught': {
        name: "Kinetic Onslaught",
        icon: "trail_length_short",
        description: "By mastering the physics of force projection, these forces strike with a relentless rhythm, conserving energy to maintain a constant, overwhelming offensive.",
        effect: "Attack orders gain an additional +1 combat bonus."
    },
    'memetic-resonance': {
        name: "Memetic Resonance",
        icon: "monitor_heart",
        description: "A powerful cultural signal projects from controlled enclaves, subtly influencing the development of neutral enclaves.",
        effect: "Holding orders reduce nearby neutral enclaves by 1 force per turn."
    },
    'genesis-forge': {
        name: "Genesis Forge",
        icon: "build_circle",
        description: "By diverting all resources to internal development, fortified enclaves unlock incredible production potential, rapidly expanding their core strength.",
        effect: "Holding orders generate 1 extra force per turn."
    },
    'panopticon-web': {
        name: "Panopticon Web",
        icon: "graph_3",
        description: "An invisible web of data streams and ghost-agents blankets the globe, ensuring nothing escapes the all-seeing eye.",
        effect: "Assist orders transfer 1/3 of forces instead of 1/4."
    }
};