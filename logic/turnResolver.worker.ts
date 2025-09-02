

import { resolveTurn } from './turnResolver';
import { serializeResolvedTurn } from '../utils/threeUtils';
import { GAME_CONFIG } from '../data/config';
import * as THREE from 'three';

// ARCHITECTURAL FIX: Add a global error handler. This is a robust "catch-all"
// that will trap any unhandled exception during the worker's lifecycle (including
// module loading/parsing) and report it to the main thread. This is critical for
// diagnosing silent crashes.
self.onerror = (event) => {
    // Prevent the default browser error handling.
    event.preventDefault();
    const errorData = {
        error: `A fatal error occurred in the worker: ${event.message}`,
        filename: event.filename,
        lineno: event.lineno,
    };
    console.error("Global worker error caught:", errorData);
    // Send a structured error message back to the main thread.
    self.postMessage(JSON.stringify({ error: errorData.error }));
};


// This is the main entry point for the web worker.
// It listens for messages from the main thread, which will contain the game state.
self.onmessage = (e: MessageEvent) => {
    try {
        // The data from the main thread is a string, so we need to parse it.
        const payload = JSON.parse(e.data);
        
        // Re-hydrate THREE.Vector3 instances from plain objects
        if (payload.enclaveData) {
            for (const id in payload.enclaveData) {
                if (payload.enclaveData[id].center) {
                     payload.enclaveData[id].center = new THREE.Vector3(payload.enclaveData[id].center.x, payload.enclaveData[id].center.y, payload.enclaveData[id].center.z);
                }
            }
        }
        if (payload.activeDisasterMarkers) {
             payload.activeDisasterMarkers.forEach((marker: any) => {
                if (marker.position) {
                    marker.position = new THREE.Vector3(marker.position.x, marker.position.y, marker.position.z);
                }
             });
        }
        
        // Call the main turn resolution logic.
        const result = resolveTurn(
            payload.enclaveData,
            payload.pendingOrders,
            payload.routes,
            payload.currentTurn,
            payload.activeDisasterMarkers,
            GAME_CONFIG
        );
        
        // Add the session ID back to the result for validation on the main thread.
        const resultWithSession = { ...result, gameSessionId: payload.gameSessionId };

        // Post the result back to the main thread.
        self.postMessage(JSON.stringify(serializeResolvedTurn(resultWithSession)));

    } catch (error) {
        // If an error occurs, send it back to the main thread for display.
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred in the worker.";
        console.error("Error in turn resolver worker:", error);
        self.postMessage(JSON.stringify({ error: errorMessage }));
    }
};