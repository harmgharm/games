import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace configuration
 * Defines all projects that should be tested
 */
export default defineWorkspace([
  // Frontend app
  'apps/web/vitest.config.ts',

  // Backend server
  'apps/server/vitest.config.ts',

  // Packages with tests
  'packages/utils/vitest.config.ts',
  'packages/validation/vitest.config.ts',
]);
