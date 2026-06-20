/// <reference types="cypress" />

// Flujo crítico (SAD §7): editar en un formulario complejo y confirmar con feedback.
// Ejercita FormField (vee-validate + Zod) + Select del DS + Toast de éxito + navegación.
describe('Edición de usuario', () => {
  beforeEach(() => {
    cy.login()
    cy.contains('table tbody tr', 'Ada Lovelace').should('be.visible')
  })

  it('carga el detalle, guarda cambios y muestra un toast de éxito', () => {
    // Entrar al detalle desde la acción "Editar" de la fila de Ada.
    cy.contains('table tbody tr', 'Ada Lovelace').contains('a', 'Editar').click()
    cy.location('pathname').should('eq', '/users/1')

    // El formulario llega precargado con los datos del usuario.
    cy.findByLabel('Nombre').should('have.value', 'Ada Lovelace')
    cy.findByLabel('Correo').should('have.value', 'ada@telar.dev')

    // Modificar y guardar.
    cy.findByLabel('Nombre').clear().type('Ada Lovelace King')
    cy.contains('button', 'Guardar cambios').click()

    // Feedback de éxito (Toast) y vuelta al listado.
    cy.contains('Cambios guardados').should('be.visible')
    cy.location('pathname').should('eq', '/users')

    // El listado no refresca solo (el detalle escribe vía service, no por el store), pero
    // el cambio sí persistió en el backend simulado: reabrir el detalle lo confirma.
    cy.contains('table tbody tr', 'Ada Lovelace').contains('a', 'Editar').click()
    cy.findByLabel('Nombre').should('have.value', 'Ada Lovelace King')
  })

  it('valida el formulario antes de enviar (campo requerido vacío)', () => {
    cy.contains('table tbody tr', 'Ada Lovelace').contains('a', 'Editar').click()
    cy.findByLabel('Nombre').clear()
    cy.contains('button', 'Guardar cambios').click()
    // No navega: la validación de Zod bloquea el submit y muestra el error del campo.
    cy.location('pathname').should('eq', '/users/1')
    cy.get('[role="alert"]').should('exist')
  })

  it('no tiene violaciones de accesibilidad en el detalle', () => {
    cy.contains('table tbody tr', 'Ada Lovelace').contains('a', 'Editar').click()
    cy.findByLabel('Nombre').should('have.value', 'Ada Lovelace')
    cy.a11y()
  })
})
