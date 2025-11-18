// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Root ESLint configuration
 * Minimal config for root-level config files only
 */
export default tseslint.config(
  // Ignore all app/package code (they have their own configs)
  {
    ignores: ['node_modules', 'dist', '.turbo', 'apps/**', 'packages/**', 'docker/**'],
  },

  // Basic recommended rules for root config files
  eslint.configs.recommended,

  // Root config files
  {
    files: ['*.config.{js,ts}', '*.workspace.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Relaxed rules for config files
      'no-unused-vars': 'off',
    },
  },
);
