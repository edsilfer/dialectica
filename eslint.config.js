import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import * as emotion from '@emotion/eslint-plugin'
import globals from 'globals'

/**
 * ESLint flat-config
 *
 * Order matters: later configs override earlier ones for matching files.
 * We begin with core recommended rules, then layer on framework / language
 * specific recommended sets, and finally apply Prettier to disable
 * formatting-related rules.
 */
export default [
  // Ignore build artifacts and third-party code
  {
    ignores: ['**/dist/**', '**/build/**', '**/node_modules/**'],
  },

  // Base JavaScript best-practice rules
  js.configs.recommended,

  // React & React-Hooks recommended rules (JSX/TSX only)
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      '@emotion': emotion,
    },
    settings: {
      react: { version: 'detect', jsxRuntime: 'automatic' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      '@emotion/jsx-import': 'off',
      '@emotion/no-vanilla': 'error',
      '@emotion/syntax-preference': ['error', 'string'],
      '@emotion/import-from-emotion': 'error',

      /*
       * - React 17+ introduced a new JSX transform that doesn't require React in scope.
       * - JSX compiles without using React.createElement, making the import unnecessary.
       */
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
    },
  },

  // TypeScript recommended rules (require type-checking)
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.base.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Bring in TypeScript's recommended (type-checked) rules
      ...tsPlugin.configs['recommended-type-checked'].rules,

      // Project-specific tweaks/overrides
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },

  // Disable rules that conflict with Prettier formatting
  {
    ...prettier,
  },

  // Provide browser globals (e.g., window, document, requestAnimationFrame) to every file
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  // Add Node.js globals for utility files that may need to access Node.js APIs
  {
    files: ['**/utils/**/*.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
]
