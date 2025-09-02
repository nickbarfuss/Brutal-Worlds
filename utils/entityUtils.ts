import { Enclave, Owner } from '../types/game';

/**
 * A centralized function to get the Material Symbols icon name for a given entity type.
 * This ensures consistency across the UI (e.g., InspectorCard, InfoDisplay).
 * @param type - The type of the entity ('enclave', 'domain', 'rift', 'expanse').
 * @returns The string name of the Material Symbols icon.
 */
export const getIconForEntityType = (type: 'enclave' | 'domain' | 'rift' | 'expanse' | 'world'): string => {
  switch (type) {
    case 'enclave':
      return 'blur_circular';
    case 'domain':
      return 'trip_origin';
    case 'rift':
      return 'grain';
    case 'expanse':
      return 'lens_blur';
    case 'world':
      return 'public';
    default:
      // This should not happen with TypeScript, but as a safeguard:
      return 'help';
  }
};

/**
 * A centralized function to get the Material Symbols icon name for a given route status.
 * This ensures consistency across the UI (e.g., InspectorCard, MapCanvas).
 * @param status - The status of the route ('disabled' or 'destroyed').
 * @returns The string name of the Material Symbols icon.
 */
export const getIconForRouteStatus = (status: 'disabled' | 'destroyed'): string => {
    switch (status) {
        case 'disabled':
            return 'warning';
        case 'destroyed':
            return 'emergency_home';
        default:
            return 'help';
    }
};

/**
 * Determines the owner of a domain based on the ownership of its constituent enclaves.
 * This function is the single source of truth for domain ownership.
 * @param domainId - The ID of the domain to check.
 * @param enclaveData - The current state of all enclaves.
 * @returns The owner ('player-1', 'player-2') if all enclaves in the domain belong to that owner, otherwise null (for contested, neutral, or empty domains).
 */
export const getDomainOwner = (domainId: number, enclaveData: { [id: number]: Enclave }): Owner => {
    const enclavesInDomain = Object.values(enclaveData).filter(e => e.domainId === domainId);
    if (enclavesInDomain.length === 0) {
        return null;
    }

    const firstOwner = enclavesInDomain[0].owner;
    // Check if all enclaves have the same owner as the first one.
    const allSameOwner = enclavesInDomain.every(e => e.owner === firstOwner);

    if (allSameOwner) {
        // If they all have the same owner, return that owner (this can be null for a fully neutral domain).
        return firstOwner;
    } else {
        // If there's a mix of owners, the domain is contested.
        return null;
    }
};
