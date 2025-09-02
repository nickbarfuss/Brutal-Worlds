
import * as THREE from 'three';
import { Enclave, MapCell, ActiveDisasterMarker, ActiveEffect } from '../types/game';

interface PlainVector3 {
    x: number;
    y: number;
    z: number;
}

/**
 * Safely deserializes a plain object back into a THREE.Vector3 instance.
 * @param o The plain object, which may be malformed or null.
 * @returns A THREE.Vector3 instance. Returns a zero vector as a fallback.
 */
export const deserializeVector3 = (o: PlainVector3): THREE.Vector3 => {
    // FIX: Added isFinite checks to prevent NaN poisoning of Vector3 objects,
    // which can cause critical, hard-to-trace errors in the 3D renderer.
    if (o && isFinite(o.x) && isFinite(o.y) && isFinite(o.z)) {
        return new THREE.Vector3(o.x, o.y, o.z);
    }
    console.warn("Attempted to deserialize a non-Vector3-like object, using fallback.", o);
    return new THREE.Vector3(0, 0, 0);
};


/**
 * Safely serializes a THREE.Vector3 instance into a plain object.
 * @param v The object to serialize, which may not be a valid Vector3.
 * @returns A plain object with x, y, z properties. Returns a zero vector as a fallback.
 */
export const serializeVector3 = (v: THREE.Vector3): PlainVector3 => {
    if (v instanceof THREE.Vector3) {
        return { x: v.x, y: v.y, z: v.z };
    }
    console.warn("Attempted to serialize a non-Vector3 object, using fallback.", v);
    return { x: 0, y: 0, z: 0 };
};

// Serializes the game state to be sent TO the worker.
export const serializeGameStateForWorker = (payload: any) => {
    return {
        // Simple, cloneable properties
        pendingOrders: payload.pendingOrders,
        routes: payload.routes,
        currentTurn: payload.currentTurn,
        gameSessionId: payload.gameSessionId,

        // Complex properties that need sanitization
        enclaveData: Object.fromEntries(
            Object.entries(payload.enclaveData as { [id: number]: Enclave }).map(([id, enclave]) => {
                const sanitizedEnclave = {
                    id: enclave.id,
                    name: enclave.name,
                    owner: enclave.owner,
                    forces: enclave.forces,
                    center: serializeVector3(enclave.center),
                    domainId: enclave.domainId,
                    activeEffects: (enclave.activeEffects || []).map(effect => ({
                        id: effect.id,
                        profileKey: effect.profileKey,
                        icon: effect.icon,
                        duration: effect.duration,
                        maxDuration: effect.maxDuration,
                        phase: effect.phase,
                        metadata: effect.metadata,
                        // 'rules' are stripped here as they can contain functions
                    })),
                    vfxToPlayThisTurn: enclave.vfxToPlayThisTurn || [],
                    sfxToPlayThisTurn: enclave.sfxToPlayThisTurn || [],
                    archetypeKey: enclave.archetypeKey,
                    imageUrl: enclave.imageUrl,
                };
                return [id, sanitizedEnclave];
            })
        ),
        
        activeDisasterMarkers: (payload.activeDisasterMarkers || []).map((marker: ActiveDisasterMarker) => ({
            id: marker.id,
            profileKey: marker.profileKey,
            icon: marker.icon,
            position: serializeVector3(marker.position),
            duration: marker.duration,
            targetEnclaveIds: marker.targetEnclaveIds,
            metadata: marker.metadata,
        })),
    };
};

// Serializes the result of resolveTurn to be sent back from the worker.
export const serializeResolvedTurn = (result: any) => {
    return {
        // Simple, cloneable properties
        newPendingOrders: result.newPendingOrders,
        newRoutes: result.newRoutes,
        newCurrentTurn: result.newCurrentTurn,
        gameOverState: result.gameOverState,
        gameSessionId: result.gameSessionId,

        // Complex properties that need sanitization
        newEnclaveData: Object.fromEntries(
            Object.entries(result.newEnclaveData as { [id: number]: Enclave }).map(([id, enclave]) => {
                const sanitizedEnclave = {
                    id: enclave.id,
                    name: enclave.name,
                    owner: enclave.owner,
                    forces: enclave.forces,
                    center: serializeVector3(enclave.center),
                    domainId: enclave.domainId,
                    activeEffects: (enclave.activeEffects || []).map(effect => ({
                        id: effect.id,
                        profileKey: effect.profileKey,
                        icon: effect.icon,
                        duration: effect.duration,
                        maxDuration: effect.maxDuration,
                        phase: effect.phase,
                        metadata: effect.metadata,
                        // 'rules' are stripped here
                    })),
                    vfxToPlayThisTurn: enclave.vfxToPlayThisTurn || [],
                    sfxToPlayThisTurn: enclave.sfxToPlayThisTurn || [],
                    archetypeKey: enclave.archetypeKey,
                    imageUrl: enclave.imageUrl,
                };
                return [id, sanitizedEnclave];
            })
        ),
        
        newDisasterMarkers: (result.newDisasterMarkers || []).map((marker: ActiveDisasterMarker) => ({
            id: marker.id,
            profileKey: marker.profileKey,
            icon: marker.icon,
            position: serializeVector3(marker.position),
            duration: marker.duration,
            targetEnclaveIds: marker.targetEnclaveIds,
            metadata: marker.metadata,
        })),
    };
};

// Deserializes the plain object result from the worker on the main thread,
// re-hydrating plain objects back into THREE.Vector3 instances.
export const deserializeResolvedTurn = (result: any) => {
    if (result.newEnclaveData) {
        Object.values(result.newEnclaveData as { [id: number]: Enclave }).forEach(enclave => {
            // This now relies on the robust deserializeVector3 function, cleaning up the logic here.
            enclave.center = deserializeVector3(enclave.center as unknown as PlainVector3);
        });
    }

    if (result.newDisasterMarkers) {
        result.newDisasterMarkers.forEach((marker: ActiveDisasterMarker) => {
             // This now relies on the robust deserializeVector3 function.
            marker.position = deserializeVector3(marker.position as unknown as PlainVector3);
        });
    }
    return result;
};