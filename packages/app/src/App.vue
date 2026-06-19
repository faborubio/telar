<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { Box, Stack, Text, Button, ToastProvider, useTheme } from '@telar/ds'
import { useAuthStore } from './stores/auth'

// El control de tema lo provee el DS (ADR-003). La app solo lo orquesta.
const { theme, toggle } = useTheme()

const router = useRouter()
const auth = useAuthStore()
const { isAuthenticated, user } = storeToRefs(auth)

function logout(): void {
  auth.signOut()
  void router.push('/login')
}
</script>

<template>
  <ToastProvider>
    <div class="app-shell">
      <Box as="header" background="surface" bordered class="app-header">
        <div class="app-container app-header__inner">
          <Stack direction="row" align="center" justify="between" gap="4">
            <Text as="strong" size="lg" weight="bold">🧵 Tejido</Text>

            <Stack direction="row" align="center" gap="4">
              <RouterLink to="/">Inicio</RouterLink>
              <RouterLink to="/users">Usuarios</RouterLink>
              <RouterLink to="/about">Acerca de</RouterLink>

              <button type="button" class="theme-toggle" @click="toggle">
                {{ theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro' }}
              </button>

              <template v-if="isAuthenticated">
                <Text tone="text-muted" size="sm">{{ user?.name ?? 'Sesión activa' }}</Text>
                <Button size="sm" variant="secondary" @click="logout">Salir</Button>
              </template>
              <RouterLink v-else to="/login">Iniciar sesión</RouterLink>
            </Stack>
          </Stack>
        </div>
      </Box>

      <main class="app-container">
        <RouterView />
      </main>
    </div>
  </ToastProvider>
</template>

<style scoped>
@layer app {
  .app-header__inner {
    padding-block: var(--space-3);
  }

  .theme-toggle {
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-md);
    border: var(--border-width-thin) solid var(--color-border-strong);
    background: var(--color-surface);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }

  .theme-toggle:hover {
    background: var(--color-bg-muted);
  }
}
</style>
