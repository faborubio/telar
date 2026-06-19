<script setup lang="ts">
import { h, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { PageHeader, DataTable, Button, Stack } from '@telar/ds'
import type { ColumnDef } from '@tanstack/vue-table'
import { useUsersStore } from '../stores/users'
import type { User } from '../types/user'

// Esta pantalla solo compone DS + consume el store (SAD §6): no hace fetch directo.
const store = useUsersStore()
const { users, loading, error } = storeToRefs(store)

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Rol' },
  { accessorKey: 'status', header: 'Estado' },
  {
    accessorKey: 'createdAt',
    header: 'Alta',
    cell: (info) => new Date(info.getValue() as string).toLocaleDateString('es'),
  },
  {
    id: 'actions',
    header: 'Acciones',
    enableSorting: false,
    enableGlobalFilter: false,
    cell: (info) => h(RouterLink, { to: `/users/${info.row.original.id}` }, () => 'Editar'),
  },
]

onMounted(() => {
  if (users.value.length === 0) void store.load()
})
</script>

<template>
  <Stack gap="6" class="users-page">
    <PageHeader title="Usuarios" description="Gestiona el acceso y los roles del equipo.">
      <template #actions>
        <Button variant="secondary">Exportar</Button>
        <Button>Nuevo usuario</Button>
      </template>
    </PageHeader>

    <DataTable
      :columns="columns"
      :data="users"
      caption="Listado de usuarios del panel"
      :loading="loading"
      :error="error ?? undefined"
      filter-label="Buscar usuario"
      filter-placeholder="Por nombre, email, rol…"
      empty-message="No hay usuarios que mostrar."
      @retry="store.load()"
    />
  </Stack>
</template>

<style scoped>
@layer app {
  .users-page {
    padding-block: var(--space-8);
  }
}
</style>
