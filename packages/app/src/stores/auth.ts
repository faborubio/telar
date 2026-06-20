import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { BACKEND } from '../config'
import { login, logout, restoreSession } from '../services/auth'
import type { User } from '../types/user'

const TOKEN_KEY = 'telar-token'

export const useAuthStore = defineStore('auth', () => {
  // En mock el token se persiste en localStorage; en firebase lo gestiona el SDK (restoreSession).
  const token = ref<string | null>(
    BACKEND === 'mock' && typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  )
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  async function signIn(email: string, password: string): Promise<void> {
    const result = await login(email, password)
    token.value = result.token
    user.value = result.user
    if (BACKEND === 'mock' && typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, result.token)
    }
  }

  function signOut(): void {
    // Limpieza síncrona del estado (el guard reacciona de inmediato);
    token.value = null
    user.value = null
    if (BACKEND === 'mock' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    } else {
      // el signOut del backend (Firebase) es fire-and-forget.
      void logout()
    }
  }

  // Restaura la sesión persistida (firebase) antes del primer render. Mock no la necesita.
  async function init(): Promise<void> {
    if (BACKEND !== 'firebase') return
    const session = await restoreSession()
    if (session) {
      token.value = session.token
      user.value = session.user
    }
  }

  return { token, user, isAuthenticated, signIn, signOut, init }
})
