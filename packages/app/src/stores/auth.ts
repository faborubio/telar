import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login } from '../services/auth'
import type { User } from '../types/user'

const TOKEN_KEY = 'telar-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(
    typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  )
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => token.value !== null)

  async function signIn(email: string, password: string): Promise<void> {
    const result = await login(email, password)
    token.value = result.token
    user.value = result.user
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, result.token)
  }

  function signOut(): void {
    token.value = null
    user.value = null
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY)
  }

  return { token, user, isAuthenticated, signIn, signOut }
})
