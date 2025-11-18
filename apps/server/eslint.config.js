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

  // Migration files - special relaxations
  // Migrations use Kysely<unknown> which causes many "unsafe" errors
  // They're also CLI scripts that need process.exit and console output
  {
    files: ['**/migrations/**/*.ts', '**/db/migrate.ts'],
    rules: {
      // Kysely<unknown> returns untyped values in migrations
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',

      // CLI scripts need these
      'unicorn/no-process-exit': 'off',
      'no-console': 'off',

      // Migration naming convention uses underscores (001_initial_schema.ts)
      'unicorn/filename-case': 'off',

      // Migration files can be long and complex
      'sonarjs/cognitive-complexity': 'off',
      'max-lines': 'off',

      // Allow abbreviations in CLI scripts
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/catch-error-name': 'off',
    },
  },
);
