import { http, HttpResponse, delay } from 'msw'
import { users } from './data'

// Handlers compartidos por dev (worker) y test (server) — los mismos mocks en todos lados.
export const handlers = [
  http.get('/api/users', async () => {
    await delay(300) // simula latencia para ver el estado de carga
    return HttpResponse.json(users)
  }),

  http.get('/api/users/:id', ({ params }) => {
    const user = users.find((u) => u.id === params.id)
    return user ? HttpResponse.json(user) : new HttpResponse(null, { status: 404 })
  }),

  http.put('/api/users/:id', async ({ params, request }) => {
    const idx = users.findIndex((u) => u.id === params.id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const patch = (await request.json()) as Partial<(typeof users)[number]>
    users[idx] = { ...users[idx]!, ...patch }
    return HttpResponse.json(users[idx])
  }),

  // Auth simulada: cualquier correo existente + la clave demo "telar123".
  http.post('/api/login', async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string }
    const user = users.find((u) => u.email === email)
    if (user && password === 'telar123') {
      return HttpResponse.json({ token: 'telar-fake-jwt', user })
    }
    return new HttpResponse(null, { status: 401 })
  }),
]
