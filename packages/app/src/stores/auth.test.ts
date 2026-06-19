import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth'

// Integración real auth service -> store contra MSW (ADR-006).
describe('useAuthStore (integración con MSW)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('autentica con credenciales válidas y guarda el token', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    await auth.signIn('ada@telar.dev', 'telar123')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user?.email).toBe('ada@telar.dev')
    expect(localStorage.getItem('telar-token')).toBe('telar-fake-jwt')
  })

  it('rechaza credenciales inválidas', async () => {
    const auth = useAuthStore()
    await expect(auth.signIn('ada@telar.dev', 'mala')).rejects.toThrow('Credenciales inválidas')
    expect(auth.isAuthenticated).toBe(false)
  })

  it('signOut limpia el estado y el token', async () => {
    const auth = useAuthStore()
    await auth.signIn('ada@telar.dev', 'telar123')
    auth.signOut()
    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('telar-token')).toBeNull()
  })
})
