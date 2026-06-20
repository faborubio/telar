import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Versión de la app y del DS, embebidas en el bundle para la observabilidad (SAD §10.3):
// cada evento de telemetría sabe con qué release se produjo.
function version(relativePath: string): string {
  const json = JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf-8')) as {
    version: string
  }
  return json.version
}
const appVersion = version('./package.json')
const dsVersion = version('../ds/package.json')

// Tejido es una SPA (SAD §1.3): build estático servible desde cualquier CDN.
export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __DS_VERSION__: JSON.stringify(dsVersion),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.ts'],
  },
})
