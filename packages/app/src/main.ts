import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Estilos del DS (tokens + reset + base). El consumidor los importa explícitamente.
import '@telar/ds/styles.css'
import './styles/app.css'
import App from './App.vue'
import { router } from './router'
import { initObservability } from './observability'

// Observabilidad (SAD §10.3): captura de errores + Web Vitals reales, con la versión
// DS/app embebida. Se inicia antes de montar para no perder errores tempranos.
initObservability()

// En desarrollo, MSW intercepta la red antes de montar la app (ADR-006).
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  // Exponemos MSW en window para que los tests E2E (Cypress) sobreescriban handlers en
  // runtime (worker.use). cy.intercept NO puede interceptar lo que el Service Worker ya
  // resuelve, así que el control de red en E2E pasa por aquí. Solo en DEV.
  const { http, HttpResponse } = await import('msw')
  ;(window as Window & { msw?: unknown }).msw = { worker, http, HttpResponse }
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocking().then(() => {
  createApp(App).use(createPinia()).use(router).mount('#app')
})
