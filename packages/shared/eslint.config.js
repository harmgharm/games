// @ts-check
import baseConfig from '@games/eslint-config/base.js';
import testConfig from '@games/eslint-config/test.js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist', 'node_modules', '.turbo'],
  },

  // Base config for all source files
  ...baseConfig.map((config) => ({
    ...config,
    files: config.files ?? ['**/*.{ts,tsx}'],
    languageOptions: {
      ...config.languageOptions,
      parserOptions: {
        ...config.languageOptions?.parserOptions,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  })),

  // Test config for test files
  ...testConfig,

  // Project-specific overrides
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Add any project-specific rule overrides here
    },
  },
);
