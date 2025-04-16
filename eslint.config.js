// eslint.config.js
import { defineConfig, globalIgnores } from 'eslint/config' // Assuming this helper exists, otherwise use standard array export
import globals from 'globals'
import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin' // Import TS plugin
import tsParser from '@typescript-eslint/parser' // Import TS parser
import pluginVue from 'eslint-plugin-vue'
import parserVue from 'vue-eslint-parser' // Import Vue parser
import pluginVitest from '@vitest/eslint-plugin'
import eslintConfigPrettier from 'eslint-config-prettier' // Use this instead of skipFormatting for clarity

export default defineConfig([
  // Or just export the array directly: export default [ ... ];
  // 1. Global Ignores
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  // 2. Base JS/TS Configuration (Applies to .js, .ts, .vue)
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: parserVue, // Use vue-eslint-parser for .vue files
      parserOptions: {
        parser: tsParser, // Use TS parser for <script> blocks within .vue
        extraFileExtensions: ['.vue'], // Important for vue-eslint-parser to find .vue files
        ecmaFeatures: {
          // Optional but good practice
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021, // Add modern ES globals
        'vue/setup-compiler-macros': 'readonly', // Define Vue compiler macros
      },
    },
    plugins: {
      '@typescript-eslint': tseslint, // Register TS plugin
      vue: pluginVue, // Register Vue plugin
    },
    rules: {
      // Start with recommended rules
      ...js.configs.recommended.rules,
      ...tseslint.configs['eslint-recommended'].rules, // Override ESLint rules that conflict with TS
      ...tseslint.configs.recommended.rules, // TS specific recommended rules
      ...pluginVue.configs['vue3-recommended'].rules, // Use 'vue3-recommended' for stricter rules

      // Your custom rules / overrides
      'vue/multi-word-component-names': 'off', // Allow single-word component names (like HomeView.vue)
      'vue/script-setup-uses-vars': 'error', // Ensure vars used in template are not marked unused
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ], // Warn about unused vars, allow _ prefix
      // Add other rules
    },
  },

  // 3. Vitest Specific Configuration
  {
    files: ['src/**/__tests__/*', '**/*.spec.ts', '**/*.test.ts'], // Target test files
    plugins: {
      vitest: pluginVitest,
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      // Add specific test rules if needed
    },
    languageOptions: {
      globals: {
        ...globals.node, // Test files often run in Node-like env
        ...pluginVitest.environments.env.globals, // Vitest specific globals
      },
    },
  },

  // 4. Prettier Configuration (Must be LAST)
  // Disables ESLint formatting rules that conflict with Prettier
  eslintConfigPrettier, // Add the Prettier config object
])
