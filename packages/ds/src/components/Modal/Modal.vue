<script setup lang="ts">
// Modal — diálogo accesible. El COMPORTAMIENTO (focus trap, restore focus, escape,
// scroll lock, ARIA) lo aporta Reka UI (ADR-008); Telar solo pone tokens y CSS.
// Encapsulamos Reka tras esta API para poder sustituirlo sin romper consumidores.
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'

withDefaults(
  defineProps<{
    /** Estado abierto/cerrado (v-model:open). */
    open?: boolean
    /** Título del diálogo (obligatorio por accesibilidad). */
    title: string
    /** Descripción opcional asociada vía aria-describedby. */
    description?: string
  }>(),
  { open: false },
)

const emit = defineEmits<{ 'update:open': [value: boolean] }>()
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogPortal>
      <DialogOverlay class="telar-modal__overlay" />
      <DialogContent class="telar-modal__content">
        <header class="telar-modal__header">
          <DialogTitle class="telar-modal__title">{{ title }}</DialogTitle>
          <DialogClose class="telar-modal__close" aria-label="Cerrar">
            <span aria-hidden="true">×</span>
          </DialogClose>
        </header>

        <DialogDescription v-if="description" class="telar-modal__desc">
          {{ description }}
        </DialogDescription>

        <div class="telar-modal__body"><slot /></div>

        <footer v-if="$slots.footer" class="telar-modal__footer">
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>

<style scoped>
@layer ds {
  .telar-modal__overlay {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
  }

  .telar-modal__content {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: min(32rem, calc(100vw - var(--space-8)));
    max-height: calc(100vh - var(--space-8));
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--elevation-modal);
    padding: var(--space-6);
  }

  .telar-modal__header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: var(--space-4);
  }

  .telar-modal__title {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
  }

  .telar-modal__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--space-8);
    height: var(--space-8);
    margin: calc(-1 * var(--space-2)) calc(-1 * var(--space-2)) 0 0;
    border-radius: var(--radius-md);
    font-size: var(--font-size-xl);
    color: var(--color-text-muted);
  }

  .telar-modal__close:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }

  .telar-modal__desc {
    margin: 0;
    color: var(--color-text-muted);
  }

  .telar-modal__footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
  }
}
</style>
