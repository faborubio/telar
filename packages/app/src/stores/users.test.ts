import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import { useUsersStore } from './users'

// Integración real service -> store contra la API mockeada por MSW (ADR-006).
describe('useUsersStore (integración con MSW)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('carga usuarios desde la API mockeada', async () => {
    const store = useUsersStore()
    await store.load()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(store.users.length).toBeGreaterThan(0)
    expect(store.users[0]).toHaveProperty('email')
  })

  it('captura el error cuando la API falla', async () => {
    server.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })))
    const store = useUsersStore()
    await store.load()
    expect(store.loading).toBe(false)
    expect(store.error).toContain('500')
    expect(store.users).toEqual([])
  })
})
