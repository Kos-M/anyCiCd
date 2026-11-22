// @ts-check
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['dist/', 'built/', 'node_modules/', 'logs/'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      // Express handlers keep the (req, res, next) signature even when a parameter is unused.
      '@typescript-eslint/no-unused-vars': ['error', { args: 'none' }],
      // Allows the `declare global { namespace Express { ... } }` request augmentation in app.ts.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
      eqeqeq: ['error', 'always'],
    },
  },
);
