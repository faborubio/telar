import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Button from './Button.vue'

describe('Button', () => {
  it('renderiza el label del slot y es un <button>', () => {
    const { getByRole } = render(Button, { slots: { default: 'Guardar' } })
    const btn = getByRole('button', { name: 'Guardar' })
    expect(btn.tagName).toBe('BUTTON')
  })

  it('emite click al activarse', async () => {
    const user = userEvent.setup()
    const { getByRole, emitted } = render(Button, { slots: { default: 'Ok' } })
    await user.click(getByRole('button'))
    expect(emitted().click).toHaveLength(1)
  })

  it('no emite click cuando está disabled', async () => {
    const user = userEvent.setup()
    const { getByRole, emitted } = render(Button, {
      props: { disabled: true },
      slots: { default: 'Ok' },
    })
    await user.click(getByRole('button'))
    expect(emitted().click).toBeUndefined()
  })

  it('en loading bloquea el click y marca aria-busy', async () => {
    const user = userEvent.setup()
    const { getByRole, emitted } = render(Button, {
      props: { loading: true },
      slots: { default: 'Enviando' },
    })
    const btn = getByRole('button')
    expect(btn.getAttribute('aria-busy')).toBe('true')
    await user.click(btn)
    expect(emitted().click).toBeUndefined()
  })

  it('aplica la clase de variante', () => {
    const { getByRole } = render(Button, {
      props: { variant: 'danger' },
      slots: { default: 'Borrar' },
    })
    expect(getByRole('button').classList).toContain('telar-btn--danger')
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(Button, { slots: { default: 'Accesible' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
