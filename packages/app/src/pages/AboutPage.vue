<script setup lang="ts">
import { Box, Stack, Text } from '@telar/ds'
</script>

<template>
  <Stack gap="6" class="page">
    <Text as="h1" size="3xl" weight="bold">Acerca de Tejido</Text>
    <Box background="surface" bordered radius="lg" padding="6">
      <Stack gap="3">
        <Text>
          Tejido es la app de referencia de Telar: existe para estresar el Design System con flujos
          reales. Toda la documentación de arquitectura vive en el SAD.
        </Text>
        <Text tone="text-muted" size="sm">
          Ruta cargada con lazy loading (code splitting por ruta — SAD §9).
        </Text>
      </Stack>
    </Box>
  </Stack>
</template>

<style scoped>
@layer app {
  .page {
    padding-block: var(--space-8);
  }
}
</style>
