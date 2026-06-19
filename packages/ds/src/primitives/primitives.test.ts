import { render } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import Stack from './Stack.vue'
import Text from './Text.vue'

describe('Stack', () => {
  it('renderiza un flex con gap tokenizado', () => {
    const { container } = render(Stack, {
      props: { direction: 'row', gap: '6' },
      slots: { default: 'x' },
    })
    const el = container.firstElementChild as HTMLElement
    expect(el.style.display).toBe('flex')
    expect(el.style.flexDirection).toBe('row')
    expect(el.style.gap).toBe('var(--space-6)')
  })

  it('mapea align/justify a valores flex', () => {
    const { container } = render(Stack, {
      props: { align: 'center', justify: 'between' },
      slots: { default: 'x' },
    })
    const el = container.firstElementChild as HTMLElement
    expect(el.style.alignItems).toBe('center')
    expect(el.style.justifyContent).toBe('space-between')
  })
})

describe('Text', () => {
  it('aplica tamaño, peso y tono como tokens', () => {
    const { container } = render(Text, {
      props: { size: 'lg', weight: 'bold', tone: 'danger' },
      slots: { default: 'hola' },
    })
    const el = container.firstElementChild as HTMLElement
    expect(el.style.fontSize).toBe('var(--font-size-lg)')
    expect(el.style.fontWeight).toBe('var(--font-weight-bold)')
    expect(el.style.color).toBe('var(--color-danger)')
  })

  it('es polimórfico vía `as`', () => {
    const { container } = render(Text, { props: { as: 'h2' }, slots: { default: 'Título' } })
    expect(container.firstElementChild?.tagName).toBe('H2')
  })
})
