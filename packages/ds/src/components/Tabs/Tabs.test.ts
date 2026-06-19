import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Tabs from './Tabs.vue'

const tabs = [
  { label: 'Resumen', value: 'overview' },
  { label: 'Ajustes', value: 'settings' },
]

const slots = {
  overview: () => 'Contenido del resumen',
  settings: () => 'Contenido de ajustes',
}

describe('Tabs', () => {
  it('renderiza tablist con un tab por entrada y activa la primera por defecto', () => {
    render(Tabs, { props: { tabs, label: 'Secciones' }, slots })
    expect(screen.getByRole('tablist', { name: 'Secciones' })).toBeTruthy()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
    expect(screen.getByText('Contenido del resumen')).toBeTruthy()
  })

  it('cambia de pestaña al hacer click y emite el valor', async () => {
    const user = userEvent.setup()
    const { emitted } = render(Tabs, { props: { tabs, label: 'Secciones' }, slots })
    await user.click(screen.getByRole('tab', { name: 'Ajustes' }))
    expect(emitted()['update:modelValue']?.at(-1)).toEqual(['settings'])
    expect(await screen.findByText('Contenido de ajustes')).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(Tabs, { props: { tabs, label: 'Secciones' }, slots })
    expect(await axe(container)).toHaveNoViolations()
  })
})
