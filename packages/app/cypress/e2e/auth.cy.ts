/// <reference types="cypress" />

// Flujo crítico (SAD §7): autenticación + guard de ruta. Se ejercita la pantalla real,
// no se inyecta el token, porque el login es justamente uno de los caminos que duelen.
describe('Autenticación y guard de ruta', () => {
  it('redirige a /login al pedir una ruta protegida sin sesión', () => {
    cy.visit('/users')
    cy.location('pathname').should('eq', '/login')
    // El guard preserva el destino para volver tras autenticarse.
    cy.location('search').should('contain', 'redirect=/users')
  })

  it('rechaza credenciales inválidas con un mensaje accesible', () => {
    cy.visit('/login')
    cy.findByLabel('Correo').type('ada@telar.dev')
    cy.findByLabel('Contraseña').type('clave-incorrecta')
    cy.contains('button', 'Entrar').click()
    cy.contains('[role="alert"]', 'Credenciales inválidas').should('be.visible')
    cy.location('pathname').should('eq', '/login')
  })

  it('inicia sesión, vuelve al destino y permite cerrar sesión', () => {
    // Pedimos /users sin sesión → guard a /login con redirect.
    cy.visit('/users')
    cy.location('pathname').should('eq', '/login')

    cy.findByLabel('Correo').type('ada@telar.dev')
    cy.findByLabel('Contraseña').type('telar123')
    cy.contains('button', 'Entrar').click()

    // Respeta el redirect pendiente del guard.
    cy.location('pathname').should('eq', '/users')
    cy.contains('Ada Lovelace').should('be.visible')

    // Cerrar sesión vuelve a dejar la ruta protegida.
    cy.contains('button', 'Salir').click()
    cy.location('pathname').should('eq', '/login')
    cy.visit('/users')
    cy.location('pathname').should('eq', '/login')
  })

  it('no tiene violaciones de accesibilidad en el login', () => {
    cy.visit('/login')
    // La app monta de forma asíncrona (tras arrancar MSW): esperar a que renderice
    // antes de escanear, o axe vería un documento vacío.
    cy.contains('h1', 'Iniciar sesión').should('be.visible')
    cy.a11y()
  })
})
