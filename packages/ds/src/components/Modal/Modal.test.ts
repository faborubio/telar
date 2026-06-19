import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Modal from './Modal.vue'

describe('Modal', () => {
  it('no renderiza el diálogo cuando open=false', () => {
    render(Modal, { props: { open: false, title: 'Confirmar' } })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('cuando open, expone role="dialog" con nombre accesible = title', async () => {
    render(Modal, { props: { open: true, title: 'Eliminar cuenta' } })
    // Reka monta el contenido con Presence (un tick después) → findByRole espera.
    expect(await screen.findByRole('dialog', { name: 'Eliminar cuenta' })).toBeTruthy()
  })

  it('Escape solicita cierre (emite update:open=false) — comportamiento de Reka', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Modal, { props: { open: true, title: 'Confirmar' } })
    await user.keyboard('{Escape}')
    expect(emitted()['update:open']?.at(-1)).toEqual([false])
  })

  it('expone un botón de cierre accesible', async () => {
    render(Modal, { props: { open: true, title: 'Confirmar' } })
    expect(await screen.findByRole('button', { name: 'Cerrar' })).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad estando abierto', async () => {
    render(Modal, {
      props: { open: true, title: 'Confirmar', description: 'Esta acción no se puede deshacer.' },
      slots: { default: 'Cuerpo del diálogo' },
    })
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
