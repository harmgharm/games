// @ts-check
import reactConfig from '@games/eslint-config/react.js';
import testConfig from '@games/eslint-config/test.js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist', '.vinxi', '.output', 'node_modules', '.turbo', 'src/routeTree.gen.ts'],
  },

  // React config for all source files
  ...reactConfig.map((config) => ({
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
