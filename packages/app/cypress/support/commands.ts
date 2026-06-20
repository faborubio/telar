/// <reference types="cypress" />
import 'cypress-axe'

// Credenciales demo (seed de MSW + clave fija — ver mocks/handlers.ts).
const DEMO_EMAIL = 'ada@telar.dev'
const DEMO_PASSWORD = 'telar123'

/**
 * Inicia sesión a través de la UI real (form + guard de ruta). Es deliberado pasar por
 * la pantalla: el login es uno de los flujos críticos (SAD §7) y queremos ejercerlo de
 * verdad, no inyectar el token a mano.
 */
function login(email: string = DEMO_EMAIL, password: string = DEMO_PASSWORD): void {
  cy.visit('/login')
  cy.findByLabel('Correo').type(email)
  cy.findByLabel('Contraseña').type(password)
  cy.contains('button', 'Entrar').click()
  // El login redirige a /users (o al redirect pendiente del guard).
  cy.location('pathname').should('eq', '/users')
}

/** Inyecta axe y verifica 0 violaciones, logueando cada una en el command log. */
function a11y(context?: string): void {
  cy.injectAxe()
  cy.checkA11y(
    context,
    undefined,
    (violations) => {
      cy.task('log', `${violations.length} violación(es) de accesibilidad detectada(s):`)
      cy.task(
        'table',
        violations.flatMap((v) =>
          v.nodes.map((n) => ({
            id: v.id,
            impact: v.impact,
            target: n.target.join(' '),
          })),
        ),
      )
    },
    // skipFailures=false: una violación rompe el test (a11y no es opcional, SAD §8).
    false,
  )
}

/**
 * Localiza un control por su etiqueta visible, resolviendo `<label for>` → control
 * asociado (así renderiza el Input del DS). Consultar por label, no por CSS, es lo que
 * pide el SAD §7 y de paso valida la asociación accesible.
 */
function findByLabel(label: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get(`#${id}`))
}

Cypress.Commands.add('login', login)
Cypress.Commands.add('a11y', a11y)
Cypress.Commands.add('findByLabel', findByLabel)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Inicia sesión vía la UI con las credenciales demo (o las dadas). */
      login(email?: string, password?: string): void
      /** Inyecta axe y verifica 0 violaciones de accesibilidad en el contexto dado. */
      a11y(context?: string): void
      /** Encuentra un control por su nombre accesible (aria-label o <label for>). */
      findByLabel(label: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

export {}
