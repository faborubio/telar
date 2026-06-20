import type { ObservabilityTransport } from './types'

// Transport por defecto: imprime a consola. Es el punto único donde se enchufaría un
// proveedor real (Sentry/equivalente con sus source maps — SAD §10.3) sin tocar a quien
// emite los eventos. Mantenerlo vendor-agnóstico evita acoplar la app a un SDK concreto.
export function createConsoleTransport(): ObservabilityTransport {
  return {
    send(event) {
      const label = event.type === 'error' ? 'obs:error' : 'obs:metric'
      console.info(`[${label}]`, event)
    },
  }
}

// Transport nulo: para tests o entornos donde no se quiere emitir nada.
export function createNoopTransport(): ObservabilityTransport {
  return { send() {} }
}
