<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { PageHeader, Box, Stack, Text, Button, Select, FormField, useToast } from '@telar/ds'
import { userEditSchema } from '../schemas/user'
import { fetchUser, updateUser } from '../services/users'

const route = useRoute()
const router = useRouter()
const { toast } = useToast()

const id = route.params.id as string
const loading = ref(true)
const loadError = ref<string | null>(null)
const saving = ref(false)

const { handleSubmit, setValues } = useForm({ validationSchema: toTypedSchema(userEditSchema) })
// role/status se enlazan a useField y se renderizan con el Select del DS.
const { value: role } = useField<string>('role')
const { value: status } = useField<string>('status')

const roleOptions = [
  { label: 'Administrador', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Visor', value: 'viewer' },
]
const statusOptions = [
  { label: 'Activo', value: 'active' },
  { label: 'Suspendido', value: 'suspended' },
]

onMounted(async () => {
  try {
    const user = await fetchUser(id)
    setValues({ name: user.name, email: user.email, role: user.role, status: user.status })
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'No se pudo cargar el usuario'
  } finally {
    loading.value = false
  }
})

const onSubmit = handleSubmit(async (values) => {
  saving.value = true
  try {
    await updateUser(id, values)
    toast({
      title: 'Cambios guardados',
      description: `${values.name} actualizado.`,
      variant: 'success',
    })
    await router.push('/users')
  } catch (e) {
    toast({
      title: 'No se pudo guardar',
      description: e instanceof Error ? e.message : 'Error desconocido',
      variant: 'danger',
    })
  } finally {
    saving.value = false
  }
})
</script>

<template>
  <Stack gap="6" class="detail">
    <PageHeader title="Editar usuario" description="Modifica los datos y guarda los cambios." />

    <Text v-if="loading" tone="text-muted">Cargando…</Text>
    <Text v-else-if="loadError" tone="danger" role="alert">{{ loadError }}</Text>

    <Box v-else background="surface" bordered radius="lg" padding="6" class="detail__card">
      <form novalidate @submit.prevent="onSubmit">
        <Stack gap="5">
          <FormField name="name" label="Nombre" required />
          <FormField name="email" label="Correo" type="email" required />

          <Select
            :model-value="role"
            label="Rol"
            :options="roleOptions"
            @update:model-value="role = $event"
          />
          <Select
            :model-value="status"
            label="Estado"
            :options="statusOptions"
            @update:model-value="status = $event"
          />

          <Stack direction="row" gap="3" justify="end">
            <Button type="button" variant="secondary" @click="router.push('/users')">
              Cancelar
            </Button>
            <Button type="submit" :loading="saving">Guardar cambios</Button>
          </Stack>
        </Stack>
      </form>
    </Box>
  </Stack>
</template>

<style scoped>
@layer app {
  .detail {
    padding-block: var(--space-8);
  }

  .detail__card {
    max-width: 32rem;
  }
}
</style>
