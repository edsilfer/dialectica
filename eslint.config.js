import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'

export default [
  {
    ignores: ['**/.eslintrc.*', '**/dist/**', '**/build/**', '**/node_modules/**'],
  },

  js.configs.recommended,
  prettier,

  // Node-only tool-config files
  {
    files: ['**/vite.config.{js,ts}', '**/tsup.config.{js,ts}', '**/*.config.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.node, // 👈 provides process, __dirname, module, etc.
      },
      // optional but nice:
      parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    },
  },

  /*
   * - React and React Hooks rules for JSX/TSX files.
   * ------------------------------------------------------------------------------------------------
   */
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
        jsxRuntime: 'automatic',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/no-unknown-property': ['error', { ignore: ['css'] }],
    },
  },

  /*
   * - TypeScript rules with type-checking enabled.
   * ------------------------------------------------------------------------------------------------
   */
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
      ...tsPlugin.configs['recommended-type-checked'].rules,
      '@typescript-eslint/no-unused-vars': 'off', // handled by unused-imports plugin
    },
  },

  /*
   * Rmove unused imports and variables, provides auto-fixes...
   * ------------------------------------------------------------------------------------------------
   */
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  /*
   * - Define global browser environment variables.
   * - Makes symbols like `window`, `document`, and `fetch` available.
   * ------------------------------------------------------------------------------------------------
   */
  {
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },

  /*
   * - Add Node.js globals for test and utility files.
   * - Applies to scripts or backend-focused files in specified folders.
   * ------------------------------------------------------------------------------------------------
   */
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
