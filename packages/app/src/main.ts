import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Estilos del DS (tokens + reset + base). El consumidor los importa explícitamente.
import '@telar/ds/styles.css'
import './styles/app.css'
import App from './App.vue'
import { router } from './router'

// En desarrollo, MSW intercepta la red antes de montar la app (ADR-006).
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV) return
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

void enableMocking().then(() => {
  createApp(App).use(createPinia()).use(router).mount('#app')
})
