import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { useTheme } from './useTheme'

describe('useTheme', () => {
  it('aplica el tema a data-theme y permite alternarlo', async () => {
    const { theme, set, toggle } = useTheme()

    set('dark')
    await nextTick()
    expect(theme.value).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    toggle()
    await nextTick()
    expect(theme.value).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
