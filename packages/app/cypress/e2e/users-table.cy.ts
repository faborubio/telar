/// <reference types="cypress" />

// Flujo crítico (SAD §7): tabla con filtro + orden + paginación. La lógica es de TanStack
// Table (ADR-010); aquí verificamos el comportamiento observable de extremo a extremo.
describe('Listado de usuarios (DataTable)', () => {
  beforeEach(() => {
    cy.login()
    // Esperar a que MSW responda y se pinten filas reales (no el estado "Cargando…").
    cy.contains('table tbody tr', 'Ada Lovelace').should('be.visible')
  })

  it('filtra por texto y refleja el conteo de resultados', () => {
    cy.findByLabel('Buscar usuario').type('grace')
    cy.get('table tbody tr').should('have.length', 1)
    cy.contains('table tbody tr', 'Grace Hopper').should('be.visible')
    cy.contains('1 resultado(s)').should('be.visible')
  })

  it('ordena por nombre y expone aria-sort', () => {
    cy.contains('th', 'Nombre').should('have.attr', 'aria-sort', 'none')

    // Ascendente: Ada Lovelace primero.
    cy.contains('button', 'Nombre').click()
    cy.contains('th', 'Nombre').should('have.attr', 'aria-sort', 'ascending')
    cy.get('table tbody tr').first().should('contain', 'Ada Lovelace')

    // Descendente: Tim Berners-Lee primero.
    cy.contains('button', 'Nombre').click()
    cy.contains('th', 'Nombre').should('have.attr', 'aria-sort', 'descending')
    cy.get('table tbody tr').first().should('contain', 'Tim Berners-Lee')
  })

  it('pagina el cliente (10 por página sobre 12 usuarios)', () => {
    cy.get('table tbody tr').should('have.length', 10)
    cy.contains('Página 1 de 2').should('be.visible')
    cy.contains('button', 'Anterior').should('be.disabled')

    cy.contains('button', 'Siguiente').click()
    cy.contains('Página 2 de 2').should('be.visible')
    cy.get('table tbody tr').should('have.length', 2)
    cy.contains('button', 'Siguiente').should('be.disabled')

    cy.contains('button', 'Anterior').click()
    cy.contains('Página 1 de 2').should('be.visible')
  })

  it('no tiene violaciones de accesibilidad con datos cargados', () => {
    cy.a11y()
  })
})
