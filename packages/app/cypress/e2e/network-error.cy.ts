/// <reference types="cypress" />

// Flujo crítico (SAD §7): manejo de error de red. Forzamos un 500 en /api/users vía el
// handle de MSW expuesto en window (cy.intercept no puede tocar lo que resuelve el Service
// Worker), verificamos el estado de error del DataTable y la recuperación con "Reintentar".
interface MswWindow extends Window {
  msw: {
    worker: { use: (...handlers: unknown[]) => void; resetHandlers: () => void }
    http: { get: (path: string, resolver: () => unknown) => unknown }
    HttpResponse: new (body: BodyInit | null, init?: { status?: number }) => unknown
  }
}

describe('Manejo de error de red en el listado', () => {
  it('muestra el estado de error y se recupera al reintentar', () => {
    // 1) Arrancar la app (worker de MSW iniciado) en una ruta pública.
    cy.visit('/login')

    // El handle de MSW se expone tras arrancar el worker (async); esperarlo antes de usarlo.
    cy.window().should('have.property', 'msw')

    // 2) Sobrescribir el handler de listado para que falle con 500.
    cy.window().then((win) => {
      const { worker, http, HttpResponse } = (win as unknown as MswWindow).msw
      worker.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })))
    })

    // 3) Login por la UI (sin recargar: cy.visit reiniciaría el worker y perdería el override).
    cy.findByLabel('Correo').type('ada@telar.dev')
    cy.findByLabel('Contraseña').type('telar123')
    cy.contains('button', 'Entrar').click()

    // 4) El listado entra en estado de error (mensaje del service) con opción de reintentar.
    cy.location('pathname').should('eq', '/users')
    cy.contains('No se pudo cargar usuarios (HTTP 500)').should('be.visible')
    cy.contains('button', 'Reintentar').should('be.visible')

    // 5) Restaurar el handler sano y reintentar → carga correcta.
    cy.window().then((win) => {
      ;(win as unknown as MswWindow).msw.worker.resetHandlers()
    })
    cy.contains('button', 'Reintentar').click()
    cy.contains('table tbody tr', 'Ada Lovelace').should('be.visible')
    cy.contains('No se pudo cargar usuarios').should('not.exist')
  })
})
