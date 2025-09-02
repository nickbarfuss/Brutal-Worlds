// Defines the color palette for the application, mapping semantic concepts to Tailwind CSS color names and specific hex codes for non-Tailwind contexts (like Three.js).
import { SemanticColorPalette } from '../types/profiles';

// The names of the Tailwind color families used for different roles.
// This allows for easy theme changes by just changing these strings.
export const THEME_CONFIG = {
  player1: 'indigo',
  player2: 'pink',
  accent: 'indigo', // UI accent
  neutral: 'slate', // UI neutral
  disaster: 'amber',
  warning: 'amber', // For disabled states, non-critical alerts
  success: 'green',
  danger: 'red',
};

// A curated set of hex codes for use in Three.js and Canvas, where Tailwind classes are not available.
// These are manually selected from the default Tailwind palette to match the names in THEME_CONFIG.
export const PLAYER_THREE_COLORS: {
  'player-1': SemanticColorPalette;
  'player-2': SemanticColorPalette;
} = {
  'player-1': {
    base: '#3730a3',     // indigo-800 (Default Enclave)
    hover: '#4338ca',    // indigo-700
    target: '#4f46e5',   // indigo-600
    selected: '#6366f1', // indigo-500 (UI Selections)
    light: '#eef2ff',    // indigo-50
    dark: '#312e81',     // indigo-900
    disabled: '#1e1b4b', // indigo-950
    icon: '#818cf8',     // indigo-400
    text: '#818cf8',     // indigo-400
  },
  'player-2': {
    base: '#9d174d',     // pink-800 (Default Enclave)
    hover: '#be185d',    // pink-700
    target: '#db2777',   // pink-600
    selected: '#ec4899', // pink-500 (UI Selections)
    light: '#fdf2f8',    // pink-50
    dark: '#831843',     // pink-900
    disabled: '#500724', // pink-950
    icon: '#f472b6',     // pink-400
    text: '#f472b6',     // pink-400
  },
};