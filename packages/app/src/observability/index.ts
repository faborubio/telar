// Observabilidad (SAD §10.3): un frontend sin telemetría es una caja negra el día que algo
// se rompe. Esta capa captura errores globales y Web Vitals reales (RUM) y embebe la versión
// de DS + app en cada evento, para correlacionar regresiones con releases. Es vendor-agnóstica:
// hoy emite por consola; el SDK real (Sentry/equivalente) se enchufa cambiando el transport.
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'
import { createConsoleTransport } from './transport'
import type { ObservabilityTransport, ReleaseInfo } from './types'

// Versiones inyectadas en build/test por Vite (define en vite.config.ts).
const release: ReleaseInfo = { app: __APP_VERSION__, ds: __DS_VERSION__ }

type ListenerTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>

export interface ObservabilityOptions {
  /** Sumidero de eventos. Por defecto, consola (vendor-agnóstico). */
  transport?: ObservabilityTransport
  /** Target de eventos del runtime; inyectable en tests. Por defecto, `window`. */
  target?: ListenerTarget
  /** Registrar Core Web Vitals (RUM). Por defecto, true; los tests lo apagan. */
  collectWebVitals?: boolean
}

/**
 * Inicializa la observabilidad. Devuelve una función de teardown (quita los listeners),
 * útil en tests. La versión (DS + app) viaja embebida en cada evento.
 */
export function initObservability(options: ObservabilityOptions = {}): () => void {
  const transport = options.transport ?? createConsoleTransport()
  const target = options.target ?? window
  const collectWebVitals = options.collectWebVitals ?? true

  const onError = (event: ErrorEvent): void => {
    transport.send({
      type: 'error',
      message: event.message,
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: 'onerror',
      release,
      timestamp: Date.now(),
    })
  }

  const onRejection = (event: PromiseRejectionEvent): void => {
    const reason: unknown = event.reason
    transport.send({
      type: 'error',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'unhandledrejection',
      release,
      timestamp: Date.now(),
    })
  }

  target.addEventListener('error', onError as EventListener)
  target.addEventListener('unhandledrejection', onRejection as EventListener)

  if (collectWebVitals) {
    const report = (metric: Metric): void => {
      transport.send({
        type: 'metric',
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        release,
        timestamp: Date.now(),
      })
    }
    // web-vitals ya verifica internamente el soporte del navegador y no lanza si falta.
    onLCP(report)
    onCLS(report)
    onINP(report)
    onFCP(report)
    onTTFB(report)
  }

  return () => {
    target.removeEventListener('error', onError as EventListener)
    target.removeEventListener('unhandledrejection', onRejection as EventListener)
  }
}

export { createConsoleTransport, createNoopTransport } from './transport'
export type {
  ObservabilityEvent,
  ObservabilityTransport,
  ObsErrorEvent,
  ObsMetricEvent,
  ReleaseInfo,
} from './types'
