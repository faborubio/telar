<script setup lang="ts">
// RadioGroup — sobre Reka RadioGroupRoot/Item (roving tabindex, flechas y ARIA de Reka; ADR-008).
import { useId } from 'vue'
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui'

export interface RadioOption {
  label: string
  value: string
}

withDefaults(
  defineProps<{
    /** Valor seleccionado (v-model). */
    modelValue?: string
    /** Opciones del grupo. */
    options: RadioOption[]
    /** Etiqueta accesible del grupo. */
    label?: string
    disabled?: boolean
  }>(),
  { disabled: false },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const baseId = useId()
const optionId = (index: number): string => `${baseId}-${index}`
</script>

<template>
  <RadioGroupRoot
    class="telar-radio"
    :model-value="modelValue"
    :disabled="disabled"
    :aria-label="label"
    @update:model-value="$emit('update:modelValue', String($event))"
  >
    <div v-for="(opt, i) in options" :key="opt.value" class="telar-radio__option">
      <RadioGroupItem :id="optionId(i)" class="telar-radio__item" :value="opt.value">
        <RadioGroupIndicator class="telar-radio__indicator" />
      </RadioGroupItem>
      <label :for="optionId(i)" class="telar-radio__label">{{ opt.label }}</label>
    </div>
  </RadioGroupRoot>
</template>

<style scoped>
@layer ds {
  .telar-radio {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .telar-radio__option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .telar-radio__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--space-5);
    height: var(--space-5);
    padding: 0;
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border-strong);
    border-radius: var(--radius-full);
    cursor: pointer;
  }

  .telar-radio__item[data-state='checked'] {
    border-color: var(--color-action);
  }

  .telar-radio__item:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .telar-radio__indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .telar-radio__indicator::after {
    content: '';
    width: var(--space-2);
    height: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-action);
  }

  .telar-radio__label {
    cursor: pointer;
    color: var(--color-text);
  }
}
</style>
