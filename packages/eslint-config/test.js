// @ts-check
import vitest from '@vitest/eslint-plugin';
import testingLibrary from 'eslint-plugin-testing-library';
import tseslint from 'typescript-eslint';

/**
 * Test ESLint config for Vitest and Testing Library
 * Use this for test files only
 */
export default tseslint.config(
  // Vitest recommended
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/prefer-to-be': 'warn',
      'vitest/prefer-to-have-length': 'warn',
      'vitest/valid-expect': 'error',
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
  },

  // Testing Library recommended (for React tests)
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    ...testingLibrary.configs['flat/react'],
    rules: {
      ...testingLibrary.configs['flat/react'].rules,
      'testing-library/await-async-queries': 'error',
      'testing-library/await-async-utils': 'error',
      'testing-library/no-await-sync-queries': 'error',
      'testing-library/no-debugging-utils': 'warn',
      'testing-library/prefer-screen-queries': 'warn',
      'testing-library/prefer-user-event': 'warn',
    },
  },

  // Relaxed rules for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      // Allow any in tests for mocking
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow non-null assertions in tests
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow magic numbers in tests
      '@typescript-eslint/no-magic-numbers': 'off',
      // Relaxed cognitive complexity for tests
      'sonarjs/cognitive-complexity': ['error', 30],
      // Allow nested ternaries in test expectations
      'unicorn/no-nested-ternary': 'off',
      // Test files can be longer (many test cases)
      'max-lines': ['warn', 1000],
      // Simpler boolean assertions in tests
      '@typescript-eslint/strict-boolean-expressions': 'off',

      // Test-specific relaxations for mocking patterns
      // vi.mocked(repo.method) pattern triggers this
      '@typescript-eslint/unbound-method': 'off',
      // Tests need hardcoded passwords for auth testing
      'sonarjs/no-hardcoded-passwords': 'off',
      // mockResolvedValue(undefined) is required by TypeScript
      'unicorn/no-useless-undefined': 'off',
      // JSON.parse() returns any, common in response testing
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      // Numeric separators not needed in test assertions
      'unicorn/numeric-separators-style': 'off',
      // Allow abbreviations like 'i' in test loops
      'unicorn/prevent-abbreviations': 'off',
    },
  },
);
