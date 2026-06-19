import { render, screen } from '@testing-library/vue'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import PageHeader from './PageHeader.vue'

describe('PageHeader', () => {
  it('renderiza el título como h1 (rol heading nivel 1)', () => {
    render(PageHeader, { props: { title: 'Usuarios' } })
    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeTruthy()
  })

  it('muestra la descripción cuando se provee', () => {
    render(PageHeader, { props: { title: 'Usuarios', description: 'Gestiona el acceso' } })
    expect(screen.getByText('Gestiona el acceso')).toBeTruthy()
  })

  it('renderiza el slot de acciones', () => {
    render(PageHeader, {
      props: { title: 'Usuarios' },
      slots: { actions: () => h('button', 'Nuevo') },
    })
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(PageHeader, {
      props: { title: 'Usuarios', description: 'Gestiona el acceso' },
    })
    expect(await axe(container)).toHaveNoViolations()
  })
})
