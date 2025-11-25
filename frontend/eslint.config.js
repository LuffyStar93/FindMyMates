// eslint.config.js (Flat Config)
import js from '@eslint/js'
import importPlugin from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import * as tseslint from 'typescript-eslint'

export default tseslint.config(
  // 1) Ignored paths
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },

  // 2) Base JS rules
  {
    name: 'base',
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // 3) TS + React
  {
    name: 'app-ts-react',
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    rules: {
      // TS
      ...tseslint.configs.recommended.rules,

      // React
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',

      // Import order
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          groups: [['builtin', 'external'], ['internal'], ['parent', 'sibling', 'index']],
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  }
)
