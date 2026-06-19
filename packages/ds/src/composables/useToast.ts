// useToast — cola de notificaciones del DS. Estado de UI local al DS (no es estado de
// negocio: ADR-004 prohíbe stores de negocio en el DS, no una cola efímera de toasts).
// La accesibilidad (live region, foco) la aporta Reka Toast vía <ToastProvider> (ADR-008).
import { ref, readonly } from 'vue'
import type { DeepReadonly, Ref } from 'vue'

export type ToastVariant = 'info' | 'success' | 'danger'

export interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
  duration: number
}

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

const toasts = ref<ToastItem[]>([])
let seq = 0

export function useToast(): {
  toasts: DeepReadonly<Ref<ToastItem[]>>
  toast: (options: ToastOptions) => number
  dismiss: (id: number) => void
  clear: () => void
} {
  function toast(options: ToastOptions): number {
    const id = ++seq
    toasts.value.push({
      id,
      title: options.title,
      description: options.description,
      variant: options.variant ?? 'info',
      duration: options.duration ?? 5000,
    })
    return id
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function clear(): void {
    toasts.value = []
  }

  return { toasts: readonly(toasts), toast, dismiss, clear }
}
