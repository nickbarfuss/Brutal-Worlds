
import React from 'react';
import { THEME_CONFIG } from '../data/theme';
import { TAILWIND_COLORS } from '../data/colors';

/**
 * This component reads the configured accent color from the theme and injects
 * it as CSS variables into the document's :root. This allows Tailwind CSS
 * classes to use these dynamic values (e.g., `bg-[var(--color-accent-500)]`),
 * making the UI themeable from a single configuration point.
 */
const ThemeInjector: React.FC = () => {
  const accentColorName = THEME_CONFIG.accent as keyof typeof TAILWIND_COLORS;
  const accentPalette = TAILWIND_COLORS[accentColorName];

  if (!accentPalette) {
    console.warn(`Accent color "${accentColorName}" not found in TAILWIND_COLORS palette.`);
    return null;
  }

  const styles = `
    :root {
      --color-accent-50: ${accentPalette[50]};
      --color-accent-100: ${accentPalette[100]};
      --color-accent-200: ${accentPalette[200]};
      --color-accent-300: ${accentPalette[300]};
      --color-accent-400: ${accentPalette[400]};
      --color-accent-500: ${accentPalette[500]};
      --color-accent-600: ${accentPalette[600]};
      --color-accent-700: ${accentPalette[700]};
      --color-accent-800: ${accentPalette[800]};
      --color-accent-900: ${accentPalette[900]};
      --color-accent-950: ${accentPalette[950]};
    }
  `;

  return <style>{styles}</style>;
};

export default ThemeInjector;
