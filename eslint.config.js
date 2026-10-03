// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import prettier from 'eslint-config-prettier/flat';
import globals from 'globals';

export default defineConfig([
  globalIgnores([
    'dist/',
    '.astro/',
    'node_modules/',
    'content-source/',
    'reference/',
    'tests/__screenshots__/',
    'test-results/',
    'playwright-report/',
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    files: ['**/*.astro'],
    rules: {
      // Scrollable galleries must be keyboard-focusable (axe: scrollable-region-focusable).
      'astro/jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { roles: ['tabpanel', 'region', 'group'] },
      ],
    },
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.*', 'lighthouserc.cjs'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['lighthouserc.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: { globals: { ...globals.browser } },
  },
  // Keep last so Prettier owns formatting.
  prettier,
]);
