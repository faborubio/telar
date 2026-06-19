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
      external: ['vue', 'reka-ui'],
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
  },
})
