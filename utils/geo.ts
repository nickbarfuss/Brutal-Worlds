
import * as THREE from 'three';

/**
 * Converts latitude and longitude coordinates to a 3D vector on a sphere.
 * @param lat - Latitude in degrees.
 * @param lon - Longitude in degrees.
 * @param radius - The radius of the sphere.
 * @returns A THREE.Vector3 representing the point on the sphere's surface.
 */
export const convertLatLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);
    return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
};
