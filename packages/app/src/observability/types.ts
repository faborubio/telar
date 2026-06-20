// Contratos de la capa de observabilidad (SAD §10.3). Vendor-agnósticos: el resto de la
// app produce estos eventos; un transport decide a dónde van (consola hoy, un DSN real
// —Sentry/equivalente— mañana, sin tocar el código que los emite).

/** Versión embebida en cada evento para correlacionar regresiones con releases (SAD §10.3). */
export interface ReleaseInfo {
  /** Versión de la app (Tejido). */
  app: string
  /** Versión del Design System (Telar) con el que se construyó. */
  ds: string
}

export interface ObsErrorEvent {
  type: 'error'
  message: string
  stack?: string
  /** Origen del error en el runtime del navegador. */
  source: 'onerror' | 'unhandledrejection'
  release: ReleaseInfo
  timestamp: number
}

export interface ObsMetricEvent {
  type: 'metric'
  /** Core Web Vital: LCP, CLS, INP, FCP, TTFB. */
  name: string
  value: number
  rating?: 'good' | 'needs-improvement' | 'poor'
  release: ReleaseInfo
  timestamp: number
}

export type ObservabilityEvent = ObsErrorEvent | ObsMetricEvent

/** Sumidero de eventos. Sustituible sin tocar a los emisores (punto de extensión a Sentry). */
export interface ObservabilityTransport {
  send(event: ObservabilityEvent): void
}
