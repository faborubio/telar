<script setup lang="ts">
// Button — acción primaria del DS. Sin estado de negocio; todo entra por props (ADR-004).
// Comportamiento de teclado/foco: nativo de <button>. Estilos 100% por tokens (sin valores mágicos).
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    /** Jerarquía visual de la acción. */
    variant?: Variant
    /** Tamaño del control. */
    size?: Size
    /** Atributo `type` nativo del botón. */
    type?: 'button' | 'submit' | 'reset'
    /** Deshabilita la interacción. */
    disabled?: boolean
    /** Muestra spinner y bloquea la acción (aria-busy). */
    loading?: boolean
    /** Ocupa todo el ancho disponible. */
    block?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', disabled: false, loading: false, block: false },
)

const emit = defineEmits<{ click: [event: MouseEvent] }>()

const isDisabled = computed(() => props.disabled || props.loading)

function onClick(event: MouseEvent): void {
  if (isDisabled.value) return
  emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    class="telar-btn"
    :class="[`telar-btn--${variant}`, `telar-btn--${size}`, { 'telar-btn--block': block }]"
    :disabled="isDisabled"
    :aria-busy="loading ? 'true' : undefined"
    @click="onClick"
  >
    <span v-if="loading" class="telar-btn__spinner" aria-hidden="true" />
    <span class="telar-btn__label"><slot /></span>
  </button>
</template>

<style scoped>
@layer ds {
  .telar-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border-radius: var(--button-radius);
    font-family: inherit;
    font-weight: var(--button-font-weight);
    line-height: 1;
    cursor: pointer;
    transition:
      background-color 120ms ease,
      border-color 120ms ease;
    border: var(--border-width-thin) solid transparent;
  }

  .telar-btn:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .telar-btn--block {
    width: 100%;
  }

  /* Tamaños */
  .telar-btn--sm {
    padding: var(--space-1) var(--space-3);
    font-size: var(--font-size-sm);
  }
  .telar-btn--md {
    padding: var(--button-padding-y) var(--button-padding-x);
    font-size: var(--font-size-md);
  }
  .telar-btn--lg {
    padding: var(--space-3) var(--space-6);
    font-size: var(--font-size-lg);
  }

  /* Variantes */
  .telar-btn--primary {
    background: var(--button-primary-bg);
    color: var(--button-primary-fg);
  }
  .telar-btn--primary:not(:disabled):hover {
    background: var(--button-primary-bg-hover);
  }
  .telar-btn--primary:not(:disabled):active {
    background: var(--button-primary-bg-active);
  }

  .telar-btn--secondary {
    background: var(--button-secondary-bg);
    color: var(--button-secondary-fg);
    border-color: var(--button-secondary-border);
  }
  .telar-btn--secondary:not(:disabled):hover {
    background: var(--button-secondary-bg-hover);
  }

  .telar-btn--danger {
    background: var(--button-danger-bg);
    color: var(--button-danger-fg);
  }
  .telar-btn--danger:not(:disabled):hover {
    filter: brightness(0.94);
  }

  .telar-btn__spinner {
    width: 1em;
    height: 1em;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-full);
    animation: telar-btn-spin 0.6s linear infinite;
  }

  @keyframes telar-btn-spin {
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
