import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', '.husky', 'eslint.config.js', 'babel.config.cjs']
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'shared/**/*.ts', 'vite.config.ts'],
    extends: tseslint.configs.recommendedTypeChecked,
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.server.json'],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports'
        }
      ]
    }
  },
  {
    files: ['server/**/*.ts', 'vite.config.ts'],
    languageOptions: {
      globals: globals.node
    }
  },
  eslintConfigPrettier
);
