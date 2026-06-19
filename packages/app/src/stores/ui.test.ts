import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from './ui'

describe('useUiStore', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('arranca con el sidebar abierto', () => {
    expect(useUiStore().sidebarOpen).toBe(true)
  })

  it('alterna el estado del sidebar', () => {
    const ui = useUiStore()
    ui.toggleSidebar()
    expect(ui.sidebarOpen).toBe(false)
    ui.toggleSidebar()
    expect(ui.sidebarOpen).toBe(true)
  })
})
