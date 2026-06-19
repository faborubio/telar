import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Checkbox from './Checkbox.vue'

describe('Checkbox', () => {
  it('expone role checkbox con nombre accesible = label', () => {
    render(Checkbox, { props: { label: 'Acepto los términos' } })
    expect(screen.getByRole('checkbox', { name: 'Acepto los términos' })).toBeTruthy()
  })

  it('emite update:modelValue al marcar', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Checkbox, { props: { label: 'Recordarme' } })
    await user.click(screen.getByRole('checkbox'))
    expect(emitted()['update:modelValue']?.at(-1)).toEqual([true])
  })

  it('refleja el estado marcado vía aria-checked', () => {
    render(Checkbox, { props: { label: 'Activo', modelValue: true } })
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true')
  })

  it('no emite cuando está disabled', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Checkbox, { props: { label: 'Bloqueado', disabled: true } })
    await user.click(screen.getByRole('checkbox'))
    expect(emitted()['update:modelValue']).toBeUndefined()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(Checkbox, { props: { label: 'Accesible' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
