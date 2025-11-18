import sharedConfig from '@games/tailwind-config';
import type { Config } from 'tailwindcss';

/**
 * Web app Tailwind CSS configuration
 * Extends the shared preset with app-specific settings
 */
const config: Config = {
  // Use shared preset
  presets: [sharedConfig as Config],

  // App-specific content paths
  content: ['./src/**/*.{ts,tsx}', './index.html'],

  // App-specific theme extensions
  theme: {
    extend: {
      // Add app-specific extensions here
    },
  },

  // App-specific plugins
  plugins: [],
};

export default config;
