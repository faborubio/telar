// Setup de tests de la app: levanta el server de MSW para interceptar la red real (ADR-006).
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
