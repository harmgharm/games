import reactConfig from '@games/eslint-config/react.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ['dist', '.vinxi', '.output', 'node_modules'],
  },
  {
    ...reactConfig,
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
