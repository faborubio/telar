// useTheme — control de tema en runtime (ADR-003).
// El tema es un atributo data-theme en <html> que reasigna el nivel semántico de tokens.
// El anti-FOUC (setear el tema ANTES del primer paint) vive en el index.html de la app (SAD §9);
// este composable maneja el cambio en runtime y la persistencia.
import { ref, watch } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'telar-theme'
const theme = ref<Theme>('light')
let initialized = false

function apply(value: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', value)
}

function resolveInitial(): Theme {
  const stored = (
    typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  ) as Theme | null
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export function useTheme() {
  if (!initialized) {
    theme.value = resolveInitial()
    apply(theme.value)
    watch(theme, (value) => {
      apply(value)
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
    })
    initialized = true
  }

  function set(value: Theme): void {
    theme.value = value
  }

  function toggle(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, set, toggle }
}
