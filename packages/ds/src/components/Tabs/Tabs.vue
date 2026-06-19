<script setup lang="ts">
// Tabs — sobre Reka Tabs (roving tabindex, flechas, roles tablist/tab/tabpanel; ADR-008).
// El contenido de cada pestaña entra por un slot nombrado igual que su `value`.
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'

export interface TabItem {
  label: string
  value: string
}

withDefaults(
  defineProps<{
    /** Pestaña activa (v-model). */
    modelValue?: string
    tabs: TabItem[]
    /** Etiqueta accesible de la lista de pestañas. */
    label?: string
  }>(),
  {},
)

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <TabsRoot
    class="telar-tabs"
    :model-value="modelValue"
    :default-value="tabs[0]?.value"
    @update:model-value="$emit('update:modelValue', String($event))"
  >
    <TabsList class="telar-tabs__list" :aria-label="label">
      <TabsTrigger v-for="t in tabs" :key="t.value" class="telar-tabs__trigger" :value="t.value">
        {{ t.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent v-for="t in tabs" :key="t.value" class="telar-tabs__content" :value="t.value">
      <slot :name="t.value" />
    </TabsContent>
  </TabsRoot>
</template>

<style scoped>
@layer ds {
  .telar-tabs__list {
    display: flex;
    gap: var(--space-1);
    border-bottom: var(--border-width-thin) solid var(--color-border);
  }

  .telar-tabs__trigger {
    padding: var(--space-2) var(--space-4);
    background: transparent;
    color: var(--color-text-muted);
    font-family: inherit;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-medium);
    border-bottom: var(--border-width-thick) solid transparent;
    margin-bottom: calc(-1 * var(--border-width-thin));
    cursor: pointer;
  }

  .telar-tabs__trigger:hover {
    color: var(--color-text);
  }

  .telar-tabs__trigger[data-state='active'] {
    color: var(--color-action);
    border-bottom-color: var(--color-action);
  }

  .telar-tabs__content {
    padding-block: var(--space-4);
  }

  .telar-tabs__content:focus-visible {
    outline: var(--border-width-thick) solid var(--color-focus-ring);
    outline-offset: 2px;
  }
}
</style>
