// ESLint flat config — raíz del monorepo.
// Incluye la REGLA DE DEPENDENCIA del SAD §4.1 / ADR-001: el DS (ds) NO puede importar de la app.
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import configPrettier from 'eslint-config-prettier'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/storybook-static/**',
      'packages/ds/src/tokens/generated/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],

  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        // En .vue, vue-eslint-parser delega <script> a typescript-eslint.
        parser: tseslint.parser,
      },
    },
  },

  // Ajustes para SFCs de Vue en un DS tipado.
  {
    files: ['**/*.vue'],
    rules: {
      // Los primitives del DS son intencionalmente de una palabra (Box, Text, Icon).
      'vue/multi-word-component-names': 'off',
      // Con TypeScript + withDefaults las props opcionales no requieren default runtime.
      'vue/require-default-prop': 'off',
    },
  },

  // ── Regla de dependencia: ds ✗→ app (un DS que conoce a su consumidor está muerto). ──
  {
    files: ['packages/ds/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@telar/app', '@telar/app/*', '**/app/**', '**/packages/app/**'],
              message:
                'Regla de dependencia (SAD §4.1 / ADR-001): el DS no puede importar de la app. Si necesitas algo de la app en el DS, el diseño está invertido.',
            },
          ],
        },
      ],
    },
  },

  // Archivos de configuración: permitir devDependencies y entorno node.
  {
    files: ['**/*.config.{ts,js,mjs}', '**/vite.config.ts', '**/build-tokens.mjs'],
    languageOptions: { globals: { ...globals.node } },
  },

  // SIEMPRE al final: desactiva las reglas de formato que entran en conflicto con Prettier.
  // Prettier es dueño del formato; ESLint, de la corrección.
  configPrettier,
)
