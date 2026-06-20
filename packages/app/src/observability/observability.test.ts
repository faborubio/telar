import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityEvent, ObservabilityTransport } from './index'

// web-vitals se mockea: en jsdom no hay paint real y queremos disparar los callbacks a mano.
const reporters: Record<string, (metric: unknown) => void> = {}
vi.mock('web-vitals', () => {
  const register =
    (name: string) =>
    (cb: (metric: unknown) => void): void => {
      reporters[name] = cb
    }
  return {
    onLCP: register('LCP'),
    onCLS: register('CLS'),
    onINP: register('INP'),
    onFCP: register('FCP'),
    onTTFB: register('TTFB'),
  }
})

import { initObservability } from './index'

function fakeTransport(): { transport: ObservabilityTransport; events: ObservabilityEvent[] } {
  const events: ObservabilityEvent[] = []
  return { transport: { send: (e) => events.push(e) }, events }
}

describe('observabilidad', () => {
  let teardown: () => void

  beforeEach(() => {
    for (const k of Object.keys(reporters)) delete reporters[k]
  })
  afterEach(() => teardown?.())

  it('captura errores globales con la versión (DS+app) embebida', () => {
    const { transport, events } = fakeTransport()
    const target = new EventTarget()
    teardown = initObservability({ transport, target, collectWebVitals: false })

    target.dispatchEvent(new ErrorEvent('error', { message: 'boom', error: new Error('boom') }))

    expect(events).toHaveLength(1)
    const event = events[0]!
    expect(event.type).toBe('error')
    expect(event).toMatchObject({ message: 'boom', source: 'onerror' })
    // El release viaja en cada evento para correlacionar con la versión desplegada.
    expect(event.release.app).toBe(__APP_VERSION__)
    expect(event.release.ds).toBe(__DS_VERSION__)
  })

  it('captura promesas rechazadas sin manejar', () => {
    const { transport, events } = fakeTransport()
    const target = new EventTarget()
    teardown = initObservability({ transport, target, collectWebVitals: false })

    const event = new Event('unhandledrejection') as Event & { reason: unknown }
    event.reason = new Error('promesa rota')
    target.dispatchEvent(event)

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'error',
      message: 'promesa rota',
      source: 'unhandledrejection',
    })
  })

  it('reporta Core Web Vitals con su rating', () => {
    const { transport, events } = fakeTransport()
    teardown = initObservability({ transport, target: new EventTarget(), collectWebVitals: true })

    // El módulo registró un reporter por métrica.
    expect(Object.keys(reporters).sort()).toEqual(['CLS', 'FCP', 'INP', 'LCP', 'TTFB'])

    reporters.LCP!({ name: 'LCP', value: 1234, rating: 'good' })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ type: 'metric', name: 'LCP', value: 1234, rating: 'good' })
  })

  it('el teardown quita los listeners (no fuga eventos tras detener)', () => {
    const { transport, events } = fakeTransport()
    const target = new EventTarget()
    const stop = initObservability({ transport, target, collectWebVitals: false })
    stop()

    target.dispatchEvent(new ErrorEvent('error', { message: 'tras teardown' }))
    expect(events).toHaveLength(0)
    teardown = () => {}
  })
})
