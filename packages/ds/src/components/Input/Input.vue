<script setup lang="ts">
// Input — campo de texto con label, ayuda y error, accesible por defecto (SAD §8).
// Ids generados con useId (Vue 3.5) para asociar label/descripción/error sin colisión.
import { computed, useId } from 'vue'

type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    /** Valor del campo (v-model). */
    modelValue?: string
    /** Etiqueta visible y asociada al input. */
    label?: string
    /** Texto de ayuda bajo el campo. */
    description?: string
    /** Mensaje de error; activa el estado inválido y role="alert". */
    error?: string
    /** Tipo nativo del input. */
    type?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    size?: Size
  }>(),
  { type: 'text', disabled: false, required: false, size: 'md' },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const inputId = useId()
const descId = useId()
const errId = useId()

// Solo se referencia lo que realmente se muestra (evita aria-describedby colgando).
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.description && !props.error) ids.push(descId)
  if (props.error) ids.push(errId)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="telar-field" :class="`telar-field--${size}`">
    <label v-if="label" :for="inputId" class="telar-field__label">
      {{ label }}
      <span v-if="required" class="telar-field__required" aria-hidden="true">*</span>
    </label>

    <input
      :id="inputId"
      class="telar-input"
      :class="{ 'telar-input--invalid': error }"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />

    <p v-if="description && !error" :id="descId" class="telar-field__desc">{{ description }}</p>
    <p v-if="error" :id="errId" class="telar-field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
@layer ds {
  .telar-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .telar-field__label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .telar-field__required {
    color: var(--color-danger);
  }

  .telar-input {
    width: 100%;
    box-sizing: border-box;
    background: var(--input-bg);
    color: var(--input-fg);
    border: var(--border-width-thin) solid var(--input-border);
    border-radius: var(--input-radius);
    font-family: inherit;
    transition: border-color 120ms ease;
  }

  .telar-field--sm .telar-input {
    padding: var(--space-1) var(--space-2);
    font-size: var(--font-size-sm);
  }
  .telar-field--md .telar-input {
    padding: var(--space-2) var(--space-3);
    font-size: var(--font-size-md);
  }
  .telar-field--lg .telar-input {
    padding: var(--space-3) var(--space-4);
    font-size: var(--font-size-lg);
  }

  .telar-input::placeholder {
    color: var(--input-placeholder);
  }

  .telar-input:focus-visible {
    outline: var(--border-width-thick) solid var(--input-border-focus);
    outline-offset: 1px;
    border-color: var(--input-border-focus);
  }

  .telar-input:disabled {
    background: var(--color-bg-muted);
    cursor: not-allowed;
    opacity: 0.7;
  }

  .telar-input--invalid {
    border-color: var(--color-danger);
  }

  .telar-field__desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }

  .telar-field__error {
    font-size: var(--font-size-sm);
    color: var(--color-danger);
  }
}
</style>
