import { defineConfig } from 'cypress'

// E2E (SAD §7): se corre contra el servidor de DEV de Vite, donde MSW intercepta la red
// (ADR-006). Así los mismos mocks de dev/test sirven también en E2E, sin backend real.
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: false,
    // Tasks para volcar al terminal (cypress run no muestra el command log del navegador):
    // se usan para imprimir las violaciones de axe con su id/impacto.
    setupNodeEvents(on) {
      on('task', {
        log(message: string) {
          console.log(message)
          return null
        },
        table(rows: unknown[]) {
          console.table(rows)
          return null
        },
      })
    },
    // Flujos de panel; el viewport por defecto basta. Sin reintentos en open, 2 en run
    // (los E2E tocan red simulada y animaciones; un reintento absorbe flakiness puntual).
    retries: { runMode: 2, openMode: 0 },
    video: false,
  },
})
