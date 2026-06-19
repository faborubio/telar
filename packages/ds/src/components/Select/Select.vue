<script setup lang="ts">
// Select — sobre Reka Select (teclado type-ahead, foco, posicionamiento y ARIA de Reka; ADR-008).
import { useId } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
} from 'reka-ui'

export interface SelectOption {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    /** Valor seleccionado (v-model). */
    modelValue?: string
    options: SelectOption[]
    label?: string
    placeholder?: string
    disabled?: boolean
    id?: string
  }>(),
  { placeholder: 'Selecciona…', disabled: false },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const generatedId = useId()
const triggerId = props.id ?? generatedId
</script>

<template>
  <div class="telar-select">
    <label v-if="label" :for="triggerId" class="telar-select__label">{{ label }}</label>

    <SelectRoot
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', String($event))"
    >
      <SelectTrigger :id="triggerId" class="telar-select__trigger" :aria-label="label">
        <SelectValue :placeholder="placeholder" />
        <SelectIcon class="telar-select__icon" aria-hidden="true">▾</SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent class="telar-select__content" position="popper" :side-offset="4">
          <SelectViewport class="telar-select__viewport">
            <SelectItem
              v-for="opt in options"
              :key="opt.value"
              class="telar-select__item"
              :value="opt.value"
            >
              <SelectItemIndicator class="telar-select__item-indicator">✓</SelectItemIndicator>
              <SelectItemText>{{ opt.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>

<style scoped>
@layer ds {
  .telar-select {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .telar-select__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .telar-select__trigger {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    min-width: 12rem;
    padding: var(--space-2) var(--space-3);
    background: var(--input-bg);
    color: var(--input-fg);
    border: var(--border-width-thin) solid var(--input-border);
    border-radius: var(--input-radius);
    font-size: var(--font-size-md);
    cursor: pointer;
  }

  .telar-select__trigger:focus-visible {
    outline: var(--border-width-thick) solid var(--input-border-focus);
    outline-offset: 1px;
  }

  .telar-select__trigger:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .telar-select__icon {
    color: var(--color-text-muted);
  }

  .telar-select__content {
    min-width: var(--reka-select-trigger-width);
    background: var(--color-surface);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--elevation-raised);
    padding: var(--space-1);
    z-index: 50;
  }

  .telar-select__item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    cursor: pointer;
    user-select: none;
  }

  .telar-select__item[data-highlighted] {
    outline: none;
    background: var(--color-bg-muted);
  }

  .telar-select__item[data-state='checked'] {
    color: var(--color-action);
    font-weight: var(--font-weight-medium);
  }

  .telar-select__item-indicator {
    display: inline-flex;
    width: var(--space-4);
  }
}
</style>
