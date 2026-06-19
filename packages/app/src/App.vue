<script setup lang="ts">
import { Box, Stack, Text, useTheme } from '@telar/ds'

// El control de tema lo provee el DS (ADR-003). La app solo lo orquesta.
const { theme, toggle } = useTheme()
</script>

<template>
  <div class="app-shell">
    <Box as="header" background="surface" bordered class="app-header">
      <div class="app-container app-header__inner">
        <Stack direction="row" align="center" justify="between" gap="4">
          <Text as="strong" size="lg" weight="bold">🧵 Tejido</Text>

          <Stack direction="row" align="center" gap="4">
            <RouterLink to="/">Inicio</RouterLink>
            <RouterLink to="/about">Acerca de</RouterLink>
            <button type="button" class="theme-toggle" @click="toggle">
              {{ theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro' }}
            </button>
          </Stack>
        </Stack>
      </div>
    </Box>

    <main class="app-container">
      <RouterView />
    </main>
  </div>
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
