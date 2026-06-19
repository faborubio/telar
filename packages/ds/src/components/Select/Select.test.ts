import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Select from './Select.vue'

const options = [
  { label: 'Argentina', value: 'ar' },
  { label: 'Chile', value: 'cl' },
  { label: 'México', value: 'mx' },
]

describe('Select', () => {
  it('renderiza un combobox con nombre accesible = label y muestra el placeholder', () => {
    render(Select, { props: { options, label: 'País', placeholder: 'Elige país' } })
    const trigger = screen.getByRole('combobox', { name: 'País' })
    expect(trigger.textContent).toContain('Elige país')
  })

  it('al abrir muestra las opciones y al elegir emite el valor', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Select, { props: { options, label: 'País' } })
    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: 'Chile' }))
    expect(emitted()['update:modelValue']?.at(-1)).toEqual(['cl'])
  })

  it('marca como seleccionada la opción del valor del modelo (al abrir)', async () => {
    const user = userEvent.setup()
    render(Select, { props: { options, label: 'País', modelValue: 'mx' } })
    await user.click(screen.getByRole('combobox', { name: 'País' }))
    expect(await screen.findByRole('option', { name: 'México', selected: true })).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad (cerrado)', async () => {
    const { container } = render(Select, { props: { options, label: 'País' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
