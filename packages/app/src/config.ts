// Selector de backend (ADR-017). `mock` = MSW + auth simulada (tests, E2E y dev por defecto);
// `firebase` = Firestore/Functions + Firebase Auth reales (dev contra emuladores y prod).
// La capa de services (SAD §6) es la costura: cambiar de uno a otro no toca páginas ni DS.
export const BACKEND: 'mock' | 'firebase' =
  import.meta.env.VITE_BACKEND === 'firebase' ? 'firebase' : 'mock'
