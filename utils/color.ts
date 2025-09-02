import type { ColorScale } from '../types/profiles';

// ====================================================================================
// COLOR UTILITIES
// ====================================================================================

const hexToHsl = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
};

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Generates a full 11-step color scale from a single base hex color,
 * treating the input as the "500" shade. The algorithm interpolates
 * lightness and saturation to create a palette with a similar perceptual
 * gradation to Tailwind's hand-picked color families.
 *
 * @param baseHex - The hex color to use as the 500-shade anchor.
 * @returns A ColorScale object with shades from 50 to 950.
 */
export const generateColorScale = (baseHex: string): ColorScale => {
    const [h, s, l] = hexToHsl(baseHex);

    const scale: Partial<ColorScale> = {};
    scale[500] = baseHex;

    // Define non-linear interpolation points for a more natural ramp.
    // Values are multipliers applied to the delta between the base and the pole.
    const lightnessUpRamp = { 400: 0.22, 300: 0.45, 200: 0.68, 100: 0.86, 50: 0.95 };
    const lightnessDownRamp = { 600: 0.13, 700: 0.28, 800: 0.45, 900: 0.65, 950: 0.78 };

    // Generate lighter shades (400 -> 50)
    const lightPole = 0.97;
    const deltaUp = lightPole - l;
    Object.entries(lightnessUpRamp).forEach(([shade, factor]) => {
        const targetL = l + deltaUp * factor;
        // Desaturate more as we approach white
        const targetS = s - (s * factor * 0.9);
        scale[shade as unknown as keyof ColorScale] = hslToHex(h, Math.max(0, Math.min(1, targetS)), Math.max(0, Math.min(1, targetL)));
    });

    // Generate darker shades (600 -> 950)
    const darkPole = 0.08;
    const deltaDown = l - darkPole;
    Object.entries(lightnessDownRamp).forEach(([shade, factor]) => {
        const targetL = l - deltaDown * factor;
        // Slightly increase saturation for darker mid-tones, then reduce for the darkest
        const satFactor = shade === '600' || shade === '700' ? (1 + (1 - s) * factor * 0.1) : (1 - factor * 0.2);
        const targetS = s * satFactor;
        scale[shade as unknown as keyof ColorScale] = hslToHex(h, Math.max(0, Math.min(1, targetS)), Math.max(0, Math.min(1, targetL)));
    });

    return scale as ColorScale;
};