<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { Box, Stack, Text, Button, FormField } from '@telar/ds'
import { loginSchema } from '../schemas/auth'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const serverError = ref<string | null>(null)
const submitting = ref(false)

// useForm establece el contexto que consumen los FormField hijos (vee-validate + Zod).
const { handleSubmit } = useForm({ validationSchema: toTypedSchema(loginSchema) })

const onSubmit = handleSubmit(async (values) => {
  serverError.value = null
  submitting.value = true
  try {
    await auth.signIn(values.email, values.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/users'
    await router.push(redirect)
  } catch (e) {
    serverError.value = e instanceof Error ? e.message : 'No se pudo iniciar sesión'
  } finally {
    submitting.value = false
  }
})
</script>

<template>
  <div class="login">
    <Box background="surface" bordered radius="lg" padding="6" class="login__card">
      <form novalidate @submit.prevent="onSubmit">
        <Stack gap="5">
          <Stack gap="1">
            <Text as="h1" size="2xl" weight="bold">Iniciar sesión</Text>
            <Text tone="text-muted" size="sm">
              Demo: usa cualquier correo del listado (p. ej. ada@telar.dev) y la clave
              <strong>telar123</strong>.
            </Text>
          </Stack>

          <FormField
            name="email"
            label="Correo"
            type="email"
            placeholder="ada@telar.dev"
            required
          />
          <FormField
            name="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            required
          />

          <Text v-if="serverError" tone="danger" size="sm" role="alert">{{ serverError }}</Text>

          <Button type="submit" :loading="submitting" block>Entrar</Button>
        </Stack>
      </form>
    </Box>
  </div>
</template>

<style scoped>
@layer app {
  .login {
    display: flex;
    justify-content: center;
    padding-block: var(--space-12);
  }

  .login__card {
    width: 100%;
    max-width: 26rem;
  }
}
</style>
