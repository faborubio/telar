import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Worker para desarrollo: intercepta a nivel de red en el navegador (ADR-006).
export const worker = setupWorker(...handlers)
