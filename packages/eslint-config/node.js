// @ts-check
import globals from 'globals';
import tseslint from 'typescript-eslint';

import baseConfig from './base.js';

/**
 * Node.js ESLint config for backend services
 * Extends base config with Node.js-specific settings
 */
export default tseslint.config(
  // Extend base config
  ...baseConfig,

  // Node.js specific configuration
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Console is OK in Node.js
      'no-console': 'off',

      // Unicorn adjustments for Node.js
      'unicorn/prefer-top-level-await': 'off', // Not always appropriate in Node
      'unicorn/no-process-exit': 'off', // Process.exit is common in Node.js CLIs
    },
  },
);
