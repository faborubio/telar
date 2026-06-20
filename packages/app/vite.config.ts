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
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __DS_VERSION__: JSON.stringify(dsVersion),
  },
  // En modo `firebase` (dev contra emuladores), /api/** se reenvía a la Function `api`
  // (ADR-017). En prod ese ruteo lo hace Firebase Hosting (rewrites). En modo mock no hay
  // proxy: MSW intercepta /api/** en el navegador.
  server:
    mode === 'firebase'
      ? {
          proxy: {
            '/api': {
              target: 'http://127.0.0.1:5001/demo-telar/us-central1/api',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          },
        }
      : undefined,
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
}))
