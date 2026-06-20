import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Estilos del DS (tokens + reset + base). El consumidor los importa explícitamente.
import '@telar/ds/styles.css'
import './styles/app.css'
import App from './App.vue'
import { router } from './router'
import { initObservability } from './observability'
import { BACKEND } from './config'
import { useAuthStore } from './stores/auth'

// Observabilidad (SAD §10.3): captura de errores + Web Vitals reales, con la versión
// DS/app embebida. Se inicia antes de montar para no perder errores tempranos.
initObservability()

// En modo mock + dev, MSW intercepta la red antes de montar (ADR-006). En modo firebase
// NO se arranca: la red va al backend real (Functions emulador en dev / Hosting en prod).
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || BACKEND !== 'mock') return
  const { worker } = await import('./mocks/browser')
  // Exponemos MSW en window para que los tests E2E (Cypress) sobreescriban handlers en
  // runtime (worker.use). cy.intercept NO puede interceptar lo que el Service Worker ya
  // resuelve, así que el control de red en E2E pasa por aquí. Solo en DEV.
  const { http, HttpResponse } = await import('msw')
  ;(window as Window & { msw?: unknown }).msw = { worker, http, HttpResponse }
  await worker.start({ onUnhandledRequest: 'bypass' })
}

async function bootstrap(): Promise<void> {
  await enableMocking()
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(router)
  // Restaura la sesión persistida (firebase) antes de montar, para que el guard de ruta
  // no redirija a /login durante la rehidratación. En mock es un no-op.
  await useAuthStore(pinia).init()
  app.mount('#app')
}

void bootstrap()
