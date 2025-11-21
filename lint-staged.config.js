// @ts-check

/**
 * lint-staged configuration
 * Runs on staged files before commit
 */

/** @type {import('lint-staged').Config} */
export default {
  // Format all supported files with Prettier
  '*.{ts,tsx,js,jsx,json,md,css,yml,yaml}': ['prettier --write'],

  // Lint and type-check TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix --max-warnings 0 --no-warn-ignored',
    () => 'pnpm type-check', // Type check entire project (tsc checks all files, not just staged)
  ],
};
