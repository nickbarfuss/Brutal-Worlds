export const mainNebulaVertexShader = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
export const mainNebulaFragmentShader = `
    uniform vec3 color; uniform float density; uniform float opacity; varying vec2 vUv;
    float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
    float noise(vec2 st) {
        vec2 i = floor(st); vec2 f = fract(st);
        float a = random(i); float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
    }
    void main() {
        float n = noise(vUv * 10.0) * density;
        float d = distance(vUv, vec2(0.5));
        float vignette = 1.0 - smoothstep(0.05, 0.5, d);
        gl_FragColor = vec4(color, n * vignette * opacity);
    }
`;
export const wispyNebulaVertexShader = `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
export const wispyNebulaFragmentShader = `
    uniform vec3 color; uniform float density; uniform float falloff; uniform float opacity; varying vec2 vUv;
    float random(vec2 st) { return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123); }
    float noise(vec2 st) {
        vec2 i = floor(st); vec2 f = fract(st);
        float a = random(i); float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0)); float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
    }
    float fbm(vec2 st) {
        float value = 0.0; float amplitude = 0.5;
        for (int i = 0; i < 4; i++) {
            value += amplitude * noise(st);
            st *= 2.0; amplitude *= 0.5;
        }
        return value;
    }
    void main() {
        vec2 q = vec2(fbm(vUv * 2.0), fbm(vUv * 2.0 + vec2(5.2, 1.3)));
        vec2 r = vec2(fbm(vUv * 3.0 + q * falloff), fbm(vUv * 3.0 + q * falloff + vec2(8.3, 2.8)));
        float n = fbm(vUv + r * 2.0) * density;
        float d = distance(vUv, vec2(0.5));
        float vignette = 1.0 - smoothstep(0.05, 0.5, d);
        gl_FragColor = vec4(color, n * vignette * opacity);
    }
`;

export const atmosphereVertexShader = `
    varying vec3 vNormal;
    void main() 
    {
        vNormal = normalize( normalMatrix * normal );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

export const atmosphereFragmentShader = `
    uniform vec3 glowColor;
    uniform float intensityMultiplier;
    uniform float falloffPower;
    varying vec3 vNormal;
    void main() 
    {
        // Calculate intensity based on the angle between the surface normal and the view vector.
        // The dot product is close to 0 at the rim and 1 at the center. We want the opposite.
        // pow() controls the falloff tightness.
        float intensity = pow( 1.0 - abs(dot( vNormal, vec3( 0, 0, 1.0 ) )), falloffPower );
        gl_FragColor = vec4( glowColor, 1.0 ) * intensity * intensityMultiplier;
    }
`;

export const sunVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const sunFragmentShader = `
    uniform vec3 sunColor;
    uniform float u_time;
    uniform float tonemapping;
    varying vec2 vUv;

    // 2D Random
    float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    // 2D Noise
    float noise (vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f*f*(3.0-2.0*f);
        return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.y*u.x;
    }

    void main() {
        vec2 uv = vUv - vec2(0.5);
        float d = length(uv);

        // A much more intense, searingly hot core
        float core = smoothstep(0.015, 0.0, d) * 10.0;

        // A much larger, softer corona to give the illusion of immense size
        float noisy_d = d + (noise(vUv * 5.0 + u_time * 0.2) * 0.05);
        float corona = 1.0 - smoothstep(0.1, 0.48, noisy_d); // Fade out over a much larger area
        
        // Combine and control intensity
        float raw_intensity = core + pow(corona, 2.5) * 1.5;

        // Tonemap the intensity to prevent it from blowing out into a solid white shape.
        // This compresses the brightest values, preserving detail in the core and corona,
        // while still being bright enough to create a beautiful bloom effect.
        float intensity = raw_intensity / (1.0 + raw_intensity * tonemapping);
        
        // Mix sun color with white for the core
        vec3 finalColor = mix(sunColor, vec3(1.0), smoothstep(0.02, 0.0, d));
        
        gl_FragColor = vec4(finalColor, intensity);
    }
`;