// @ts-check
import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import noOnlyTests from 'eslint-plugin-no-only-tests';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import turbo from 'eslint-plugin-turbo';
import unicorn from 'eslint-plugin-unicorn';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/**
 * Base ESLint config for TypeScript with maximum strictness
 * Includes: TypeScript strict, import-x, unicorn, sonarjs, simple-import-sort, prettier
 */
export default tseslint.config(
  // ESLint recommended
  eslint.configs.recommended,

  // TypeScript strict
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // SonarJS recommended
  sonarjs.configs.recommended,

  // Unicorn recommended
  unicorn.configs['flat/recommended'],

  // Prettier - disables conflicting formatting rules (must be last)
  prettierConfig,

  // Custom configuration
  {
    plugins: {
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
      'no-only-tests': noOnlyTests,
      turbo,
    },
    settings: {
      // TypeScript import resolver for monorepo and path aliases
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
        }),
      ],
    },
    rules: {
      // TypeScript - Maximum Strictness
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],

      // Import sorting with simple-import-sort
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Import-x rules
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off', // TypeScript handles this
      'import-x/no-named-as-default': 'warn',
      'import-x/no-named-as-default-member': 'warn',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // No test.only or describe.only in commits
      'no-only-tests/no-only-tests': 'error',

      // Turbo - Catch undeclared env vars in turbo.json
      'turbo/no-undeclared-env-vars': 'error',

      // Unicorn adjustments (some rules are too aggressive)
      'unicorn/prevent-abbreviations': [
        'error',
        {
          replacements: {
            props: false,
            ref: false,
            params: false,
            args: false,
            env: false,
            fn: false,
            db: false,
            ctx: false,
          },
        },
      ],
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            kebabCase: true,
            pascalCase: true,
          },
        },
      ],
      'unicorn/no-null': 'off', // We use null in some cases (React, APIs)
      'unicorn/prefer-top-level-await': 'off', // Not always appropriate

      // General
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'prefer-arrow-callback': 'error',

      // Code Quality - Complexity & Size (warnings, not blockers)
      'max-params': ['warn', 3],
      'max-lines': [
        'warn',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },
);
