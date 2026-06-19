import { render } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Input from './Input.vue'

describe('Input', () => {
  it('asocia el label con el input (consultable por rol+nombre)', () => {
    const { getByLabelText } = render(Input, { props: { label: 'Correo' } })
    expect(getByLabelText('Correo')).toBeTruthy()
  })

  it('emite update:modelValue al escribir', async () => {
    const user = userEvent.setup()
    const { getByLabelText, emitted } = render(Input, { props: { label: 'Nombre' } })
    await user.type(getByLabelText('Nombre'), 'Ada')
    const events = emitted()['update:modelValue']
    expect(events?.at(-1)).toEqual(['Ada'])
  })

  it('en error marca aria-invalid y asocia el mensaje vía aria-describedby', () => {
    const { getByLabelText, getByRole } = render(Input, {
      props: { label: 'Correo', error: 'Correo inválido' },
    })
    const input = getByLabelText('Correo')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const alert = getByRole('alert')
    expect(alert.textContent).toContain('Correo inválido')
    expect(input.getAttribute('aria-describedby')).toContain(alert.id)
  })

  it('muestra la descripción cuando no hay error', () => {
    const { getByText, queryByRole } = render(Input, {
      props: { label: 'Clave', description: 'Mínimo 8 caracteres' },
    })
    expect(getByText('Mínimo 8 caracteres')).toBeTruthy()
    expect(queryByRole('alert')).toBeNull()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(Input, {
      props: { label: 'Correo', description: 'Usa tu correo corporativo' },
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})
