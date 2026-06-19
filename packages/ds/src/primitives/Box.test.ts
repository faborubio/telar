import { render } from '@testing-library/vue'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import Box from './Box.vue'

describe('Box', () => {
  it('renderiza un div por defecto y el contenido del slot', () => {
    const { getByText, container } = render(Box, { slots: { default: 'contenido' } })
    expect(getByText('contenido')).toBeTruthy()
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })

  it('es polimórfico vía la prop `as`', () => {
    const { container } = render(Box, { props: { as: 'section' } })
    expect(container.firstElementChild?.tagName).toBe('SECTION')
  })

  it('aplica padding como token, no como valor mágico', () => {
    const { container } = render(Box, { props: { padding: '4' } })
    const el = container.firstElementChild as HTMLElement
    expect(el.style.padding).toBe('var(--space-4)')
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(Box, { slots: { default: 'contenido accesible' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
