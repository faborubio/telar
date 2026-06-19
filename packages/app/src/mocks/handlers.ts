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
]
