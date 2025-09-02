
import * as THREE from 'three';

export const createStarfield = (count: number, radius: number, baseSize: number) => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const color = new THREE.Color();

    const milkyWayStars = Math.floor(count * 0.60);
    const fieldStars = count - milkyWayStars;

    const galaxyLength = radius * 1.5;
    const galaxyHeight = radius * 0.4;
    const galaxyThickness = radius * 0.1;

    for (let i = 0; i < milkyWayStars; i++) {
        let x, y, z, dSq;
        do {
            x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1;
            dSq = x * x + y * y + z * z;
        } while (dSq > 1);

        const pointInEllipsoid = new THREE.Vector3(x * galaxyLength, y * galaxyHeight, z * galaxyThickness);
        pointInEllipsoid.normalize().multiplyScalar(radius * (1 + Math.random() * 0.1));
        
        positions.push(pointInEllipsoid.x, pointInEllipsoid.y, pointInEllipsoid.z);
        color.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.7 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
        sizes.push((Math.random() * 0.8 + 0.2) * baseSize * 2);
    }
    
    for (let i = 0; i < fieldStars; i++) {
        const vertex = new THREE.Vector3((Math.random() * 2 - 1), (Math.random() * 2 - 1), (Math.random() * 2 - 1)).normalize();
        vertex.multiplyScalar(radius * (1 + Math.random() * 0.1));
        positions.push(vertex.x, vertex.y, vertex.z);
        color.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.7 + Math.random() * 0.3);
        colors.push(color.r, color.g, color.b);
        sizes.push((Math.random() * 0.8 + 0.2) * baseSize * 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const randomRotation = new THREE.Euler(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    geometry.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(randomRotation));

    const material = new THREE.ShaderMaterial({
        uniforms: { globalOpacity: { value: 1.0 } },
        vertexShader: `
            attribute float size; attribute vec3 customColor; varying vec3 vColor;
            void main() {
                vColor = customColor; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (200.0 / -mvPosition.z); gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float globalOpacity; varying vec3 vColor;
            void main() {
                float d = distance(gl_PointCoord, vec2(0.5, 0.5)); if (d > 0.5) discard;
                float alpha = 1.0 - smoothstep(0.4, 0.5, d);
                gl_FragColor = vec4(vColor, alpha * globalOpacity);
            }
        `,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    });
    
    const points = new THREE.Points(geometry, material);
    points.renderOrder = -10;
    return points;
};


export const createWarpStars = () => {
    const starCount = 1000;
    const positions = new Float32Array(starCount * 2 * 3);
    const colors = new Float32Array(starCount * 2 * 3);
    const opacities = new Float32Array(starCount * 2);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: { globalOpacity: { value: 0.0 } },
        vertexShader: `
            attribute vec3 color; attribute float opacity; varying vec3 vColor; varying float vOpacity;
            void main() {
                vColor = color; vOpacity = opacity;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float globalOpacity; varying vec3 vColor; varying float vOpacity;
            void main() { gl_FragColor = vec4(vColor, vOpacity * globalOpacity); }
        `,
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });

    const lines = new THREE.LineSegments(geometry, material);
    lines.userData.stars = [];
    const farZ = -2000;
    const color = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
        const star: any = {
            pos: new THREE.Vector3((Math.random() - 0.5) * 5000, (Math.random() - 0.5) * 5000, farZ + (Math.random() * farZ)),
            vel: 100 + Math.random() * 100,
        };
        star.streakLength = star.vel * 6.0;
        lines.userData.stars.push(star);
        
        const startPos = star.pos;
        const endPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z - star.streakLength);
        positions.set([startPos.x, startPos.y, startPos.z], i * 6);
        positions.set([endPos.x, endPos.y, endPos.z], i * 6 + 3);
        
        color.setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.15);
        colors.set([color.r, color.g, color.b], i * 6);
        colors.set([color.r, color.g, color.b], i * 6 + 3);

        const baseOpacity = 0.5 + Math.random() * 0.5;
        opacities[i * 2] = baseOpacity;
        opacities[i * 2 + 1] = 0.0;
    }

    const update = (camera: THREE.Camera, spawnNew = true, speedMultiplier = 1.0) => {
        const posAttr = lines.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < starCount; i++) {
            const star = lines.userData.stars[i];
            star.pos.z += star.vel * speedMultiplier;
            
            if (star.pos.z > camera.position.z) {
                if (spawnNew) {
                    star.pos.x = (Math.random() - 0.5) * 5000;
                    star.pos.y = (Math.random() - 0.5) * 5000;
                    star.pos.z = farZ;
                }
            }

            const startPos = star.pos;
            const endPos = new THREE.Vector3(startPos.x, startPos.y, startPos.z - (star.streakLength * speedMultiplier));
            posAttr.setXYZ(i * 2, startPos.x, startPos.y, startPos.z);
            posAttr.setXYZ(i * 2 + 1, endPos.x, endPos.y, endPos.z);
        }
        posAttr.needsUpdate = true;
    };

    return { mesh: lines, update };
};
