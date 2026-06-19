// Setup global de Vitest para el DS.
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

// Matchers de accesibilidad (axe).
expect.extend(matchers)

// Polyfills que jsdom no implementa y que los componentes headless de Reka UI
// (Select, Toast, etc.) necesitan para montar/operar en el entorno de test.
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
}

if (!('scrollIntoView' in Element.prototype)) {
  Element.prototype.scrollIntoView = function scrollIntoView(): void {}
}

if (!('hasPointerCapture' in Element.prototype)) {
  Element.prototype.hasPointerCapture = function hasPointerCapture(): boolean {
    return false
  }
}

if (!('releasePointerCapture' in Element.prototype)) {
  Element.prototype.releasePointerCapture = function releasePointerCapture(): void {}
}
