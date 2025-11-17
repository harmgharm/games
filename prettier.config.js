// @ts-check

/** @type {import("prettier").Config} */
export default {
  // Formatting
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 100, // Modern standard (up from 80)
  arrowParens: 'always',
  endOfLine: 'lf',

  // Markdown
  proseWrap: 'always',

  // Plugins
  plugins: ['prettier-plugin-tailwindcss'],

  // Overrides
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 120,
      },
    },
  ],
};
