import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Tejido es una SPA (SAD §1.3): build estático servible desde cualquier CDN.
export default defineConfig({
  plugins: [vue()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.ts'],
  },
})
