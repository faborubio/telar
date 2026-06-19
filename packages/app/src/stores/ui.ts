import { defineStore } from 'pinia'
import { ref } from 'vue'

// Estado de aplicación en Pinia (ADR-004): vive en la APP, no en el DS.
// Demuestra el flujo unidireccional del SAD §6.
export const useUiStore = defineStore('ui', () => {
  const sidebarOpen = ref(true)

  function toggleSidebar(): void {
    sidebarOpen.value = !sidebarOpen.value
  }

  return { sidebarOpen, toggleSidebar }
})
