import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// Build en modo library (SAD §4.1 / §9): ESM + tipos, CSS único (telar.css),
// vue y reka-ui como externals (no se bundlean: las trae el consumidor).
export default defineConfig({
  plugins: [
    vue(),
    dts({ tsconfigPath: './tsconfig.json', include: ['src'], cleanVueFileName: true }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['vue', 'reka-ui', '@tanstack/vue-table', 'vee-validate'],
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'telar.css' : 'assets/[name][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      // Artefactos, contratos y stories no cuentan para la cobertura de comportamiento.
      exclude: [
        'src/**/*.{test,spec}.ts',
        'src/**/*.stories.ts',
        'src/test/**',
        'src/tokens/generated/**',
        'src/env.d.ts',
        'src/index.ts',
      ],
      thresholds: { lines: 80, functions: 80, statements: 80, branches: 70 },
    },
  },
})
