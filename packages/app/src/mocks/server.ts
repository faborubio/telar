import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Server para tests (Node): los mismos handlers que en dev, interceptando fetch real (ADR-006).
export const server = setupServer(...handlers)
