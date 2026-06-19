<script setup lang="ts">
// PageHeader — patrón de composición (SAD §4.2, capa 5): encabezado de página con
// título, descripción opcional y un slot de acciones (botones a la derecha).
defineProps<{
  /** Título principal de la página (se renderiza como h1). */
  title: string
  /** Texto descriptivo opcional bajo el título. */
  description?: string
}>()
</script>

<template>
  <header class="telar-page-header">
    <div class="telar-page-header__text">
      <h1 class="telar-page-header__title">{{ title }}</h1>
      <p v-if="description" class="telar-page-header__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="telar-page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
@layer ds {
  .telar-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding-block: var(--space-4);
    border-bottom: var(--border-width-thin) solid var(--color-border);
  }

  .telar-page-header__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .telar-page-header__title {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
  }

  .telar-page-header__desc {
    margin: 0;
    color: var(--color-text-muted);
  }

  .telar-page-header__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
}
</style>
