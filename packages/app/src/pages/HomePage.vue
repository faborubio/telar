<script setup lang="ts">
import { Box, Stack, Text } from '@telar/ds'
import { useUiStore } from '../stores/ui'

// Esta página se compone ENTERAMENTE de primitives del DS (SAD §1.2): cero CSS ad-hoc
// salvo el layout de página. Es la prueba viva de la regla de reuso.
const ui = useUiStore()

const tones = ['text', 'action', 'success', 'warning', 'danger'] as const
</script>

<template>
  <Stack gap="6" class="page">
    <Stack gap="2">
      <Text as="h1" size="3xl" weight="bold">Telar — Fase 0</Text>
      <Text tone="text-muted">
        Cimientos del Design System: tokens en 3 niveles, theming dark/light, primitives y la regla
        de dependencia ds ✗→ app.
      </Text>
    </Stack>

    <Box as="section" background="surface" bordered radius="lg" padding="6">
      <Stack gap="4">
        <Text as="h2" size="xl" weight="semibold">Primitives</Text>

        <Stack direction="row" gap="4" wrap>
          <Box
            v-for="tone in tones"
            :key="tone"
            background="bg-subtle"
            bordered
            radius="md"
            padding="4"
          >
            <Text :tone="tone" weight="medium">{{ tone }}</Text>
          </Box>
        </Stack>

        <Stack direction="row" align="center" gap="4">
          <button type="button" class="demo-btn" @click="ui.toggleSidebar">
            Sidebar: {{ ui.sidebarOpen ? 'abierto' : 'cerrado' }}
          </button>
          <Text tone="text-subtle" size="sm">(estado vía Pinia — capa de app, no del DS)</Text>
        </Stack>
      </Stack>
    </Box>
  </Stack>
</template>

<style scoped>
@layer app {
  .page {
    padding-block: var(--space-8);
  }

  .demo-btn {
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    background: var(--color-action);
    color: var(--color-text-on-action);
    font-weight: var(--font-weight-medium);
  }

  .demo-btn:hover {
    background: var(--color-action-hover);
  }
}
</style>
