<script setup lang="ts">
// Checkbox — sobre Reka CheckboxRoot (rol, teclado y estado los aporta Reka; ADR-008).
// El botón de Reka es "labelable", así que <label for> lo asocia y lo hace clicable.
import { useId } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    /** Estado marcado (v-model). */
    modelValue?: boolean
    /** Etiqueta visible asociada al control. */
    label?: string
    disabled?: boolean
    id?: string
  }>(),
  { modelValue: false, disabled: false },
)

defineEmits<{ 'update:modelValue': [value: boolean] }>()

const generatedId = useId()
const controlId = props.id ?? generatedId
</script>

<template>
  <div class="telar-checkbox">
    <CheckboxRoot
      :id="controlId"
      class="telar-checkbox__box"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event === true)"
    >
      <CheckboxIndicator class="telar-checkbox__indicator">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path
            d="M13.5 4.5 6.5 11.5 2.5 7.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </CheckboxIndicator>
    </CheckboxRoot>
    <label v-if="label" :for="controlId" class="telar-checkbox__label">{{ label }}</label>
  </div>
</template>

<style scoped>
@layer ds {
  .telar-checkbox {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
  }

  .telar-checkbox__box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--space-5);
    height: var(--space-5);
    padding: 0;
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-sm);
    color: var(--color-text-on-action);
    cursor: pointer;
  }

  .telar-checkbox__box[data-state='checked'] {
    background: var(--color-action);
    border-color: var(--color-action);
  }

  .telar-checkbox__box:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .telar-checkbox__indicator {
    display: inline-flex;
    width: 100%;
    height: 100%;
  }

  .telar-checkbox__indicator svg {
    width: 100%;
    height: 100%;
  }

  .telar-checkbox__label {
    cursor: pointer;
    font-size: var(--font-size-md);
    color: var(--color-text);
  }
}
</style>
