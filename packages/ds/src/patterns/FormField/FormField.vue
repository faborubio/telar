<script setup lang="ts">
// FormField — puente entre la validación headless (vee-validate, ADR-010) y el Input del DS.
// El consumidor declara el esquema (Zod) en su `useForm`; aquí solo conectamos el campo `name`
// con su valor y su mensaje de error. vee-validate es peer dependency (una sola instancia).
import { useField } from 'vee-validate'
import Input from '../../components/Input/Input.vue'

const props = withDefaults(
  defineProps<{
    /** Nombre del campo dentro del formulario (clave del esquema). */
    name: string
    label?: string
    description?: string
    type?: string
    placeholder?: string
    required?: boolean
  }>(),
  { type: 'text', required: false },
)

// useField se enlaza al contexto de formulario provisto por useForm en el componente padre.
const { value, errorMessage } = useField<string>(() => props.name)
</script>

<template>
  <Input
    v-model="value"
    :label="label"
    :description="description"
    :error="errorMessage"
    :type="type"
    :placeholder="placeholder"
    :required="required"
  />
</template>
