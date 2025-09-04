import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * Tailwind config:
 * - Uses JIT to purge unused styles from src/app, components, modules.
 * - Extend as design system evolves (colors, typography scale, etc.).
 */
const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5b3cc4',
          foreground: '#ffffff'
        }
      }
    }
  },
  plugins: [typography]
};

export default config;
