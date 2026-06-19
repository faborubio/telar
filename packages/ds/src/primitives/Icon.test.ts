import { render } from '@testing-library/vue'
import { describe, it, expect } from 'vitest'
import { h } from 'vue'
import Icon from './Icon.vue'

const svg = () => h('svg', { viewBox: '0 0 24 24' }, [h('path', { d: 'M0 0h24v24H0z' })])

describe('Icon', () => {
  it('es decorativo (aria-hidden) cuando no recibe label', () => {
    const { container } = render(Icon, { slots: { default: svg } })
    const span = container.querySelector('.telar-icon')
    expect(span?.getAttribute('aria-hidden')).toBe('true')
    expect(span?.getAttribute('role')).toBeNull()
  })

  it('se anuncia como imagen con label accesible', () => {
    const { getByRole } = render(Icon, { props: { label: 'Guardar' }, slots: { default: svg } })
    const el = getByRole('img', { name: 'Guardar' })
    expect(el.getAttribute('aria-hidden')).toBeNull()
  })
})
