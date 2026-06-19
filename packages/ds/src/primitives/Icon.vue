<script setup lang="ts">
// Icon — envoltura accesible para un SVG (pasado por slot).
// Si recibe `label`, se anuncia como imagen; si no, queda oculto para lectores (decorativo).
type Size = 'sm' | 'md' | 'lg'

defineProps<{
  size?: Size
  /** Texto accesible. Sin él, el icono es decorativo (aria-hidden). */
  label?: string
}>()
</script>

<template>
  <span
    class="telar-icon"
    :class="`telar-icon--${size ?? 'md'}`"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
  >
    <slot />
  </span>
</template>

<style scoped>
@layer ds {
  .telar-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .telar-icon :deep(svg) {
    width: 1em;
    height: 1em;
  }

  .telar-icon--sm {
    font-size: var(--icon-sm);
  }

  .telar-icon--md {
    font-size: var(--icon-md);
  }

  .telar-icon--lg {
    font-size: var(--icon-lg);
  }
}
</style>
