<script setup lang="ts">
// ToastProvider — se monta UNA vez (envuelve la app). Reka aporta la live region accesible,
// el foco y los timers; Telar pone tokens/CSS y conecta la cola de useToast (ADR-008).
import {
  ToastProvider as RekaToastProvider,
  ToastRoot,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
} from 'reka-ui'
import { useToast } from '../../composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <RekaToastProvider>
    <slot />

    <ToastRoot
      v-for="t in toasts"
      :key="t.id"
      class="telar-toast"
      :class="`telar-toast--${t.variant}`"
      :duration="t.duration"
      :type="t.variant === 'danger' ? 'foreground' : 'background'"
      @update:open="(open: boolean) => !open && dismiss(t.id)"
    >
      <div class="telar-toast__body">
        <ToastTitle class="telar-toast__title">{{ t.title }}</ToastTitle>
        <ToastDescription v-if="t.description" class="telar-toast__desc">
          {{ t.description }}
        </ToastDescription>
      </div>
      <ToastClose class="telar-toast__close" aria-label="Cerrar">
        <span aria-hidden="true">×</span>
      </ToastClose>
    </ToastRoot>

    <ToastViewport class="telar-toast__viewport" />
  </RekaToastProvider>
</template>

<style scoped>
@layer ds {
  .telar-toast__viewport {
    position: fixed;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: min(24rem, 100vw);
    max-width: 100vw;
    margin: 0;
    padding: var(--space-6);
    list-style: none;
    z-index: 100;
    outline: none;
  }

  .telar-toast {
    display: flex;
    align-items: start;
    gap: var(--space-3);
    background: var(--color-surface);
    color: var(--color-text);
    border: var(--border-width-thin) solid var(--color-border);
    border-left-width: var(--space-1);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-modal);
    padding: var(--space-4);
  }

  .telar-toast--info {
    border-left-color: var(--color-action);
  }
  .telar-toast--success {
    border-left-color: var(--color-success);
  }
  .telar-toast--danger {
    border-left-color: var(--color-danger);
  }

  .telar-toast__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .telar-toast__title {
    margin: 0;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
  }

  .telar-toast__desc {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .telar-toast__close {
    flex-shrink: 0;
    width: var(--space-6);
    height: var(--space-6);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
    line-height: 1;
  }

  .telar-toast__close:hover {
    background: var(--color-bg-muted);
    color: var(--color-text);
  }
}
</style>
