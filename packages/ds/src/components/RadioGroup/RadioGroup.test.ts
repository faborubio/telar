import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import RadioGroup from './RadioGroup.vue'

const options = [
  { label: 'Tarjeta', value: 'card' },
  { label: 'Transferencia', value: 'transfer' },
  { label: 'Efectivo', value: 'cash' },
]

describe('RadioGroup', () => {
  it('renderiza un radiogroup con un radio por opción, nombrado por su label', () => {
    render(RadioGroup, { props: { options, label: 'Método de pago' } })
    expect(screen.getByRole('radiogroup', { name: 'Método de pago' })).toBeTruthy()
    expect(screen.getByRole('radio', { name: 'Tarjeta' })).toBeTruthy()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('emite update:modelValue con el valor elegido', async () => {
    const user = userEvent.setup()
    const { emitted } = render(RadioGroup, { props: { options, label: 'Pago' } })
    await user.click(screen.getByRole('radio', { name: 'Transferencia' }))
    expect(emitted()['update:modelValue']?.at(-1)).toEqual(['transfer'])
  })

  it('marca como seleccionado el valor del modelo', () => {
    render(RadioGroup, { props: { options, label: 'Pago', modelValue: 'cash' } })
    expect(screen.getByRole('radio', { name: 'Efectivo' }).getAttribute('aria-checked')).toBe(
      'true',
    )
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(RadioGroup, { props: { options, label: 'Método de pago' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
