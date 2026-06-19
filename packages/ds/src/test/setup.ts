// Setup global de Vitest para el DS: extiende expect con los matchers de accesibilidad (axe).
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

expect.extend(matchers)
