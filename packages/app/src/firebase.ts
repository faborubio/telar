// Inicialización del SDK cliente de Firebase. Este módulo SOLO se importa (dinámicamente)
// en modo `firebase` (ver services/auth.ts), así el modo `mock` nunca carga el SDK.
import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

// En dev contra emuladores los valores son demo; en prod vienen del proyecto real (Slice 2).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'demo-telar.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'demo-telar',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'demo-app',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const auth = getAuth(firebaseApp)

// Contra el emulador de Auth (dev): conectar antes de cualquier operación de auth.
if (import.meta.env.VITE_FIREBASE_EMULATOR === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
}
