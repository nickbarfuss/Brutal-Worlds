
import { OrderProfile } from '../types/profiles';

export const ORDER_PROFILES: { [key: string]: OrderProfile } = {
    'attack': {
        name: "Attack Order", icon: 'my_location',
        description: "Launch an offensive to conquer an adjacent hostile enclave.",
        effect: "Sends 1/3 of this enclave's forces to attack. Attacking forces receive a +1 combat bonus.",
        vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/order-attack.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
    },
    'assist': {
        name: "Assist Order", icon: 'enable',
        description: "Send forces to bolster an adjacent friendly enclave.",
        effect: "Transfers 1/4 of this enclave's forces to the target enclave.",
        vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/order-assist.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
    },
    'holding': {
        name: "Holding Order", icon: 'arming_countdown',
        description: "Fortify this enclave, generating new forces. This is the only way to increase forces.",
        effect: "This enclave will not attack or assist. Generates +2 forces at the end of the turn.",
        vfx: { url: 'https://storage.googleapis.com/brutal-worlds/vfx/order-hold.png', frameWidth: 256, frameHeight: 256, columns: 5, frameRate: 24 }
    }
};
