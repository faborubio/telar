import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchUsers } from '../services/users'
import type { User } from '../types/user'

// Store de aplicación (ADR-004): estado + acción async. No conoce presentación.
export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      users.value = await fetchUsers()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error desconocido'
    } finally {
      loading.value = false
    }
  }

  return { users, loading, error, load }
})
