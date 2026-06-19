import type { Meta, StoryObj } from '@storybook/vue3'
import type { ColumnDef } from '@tanstack/vue-table'
import DataTable from './DataTable.vue'

interface User {
  name: string
  email: string
  role: string
}

const columns: ColumnDef<User>[] = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Rol' },
]

const data: User[] = [
  { name: 'Ada Lovelace', email: 'ada@telar.dev', role: 'Admin' },
  { name: 'Alan Turing', email: 'alan@telar.dev', role: 'Editor' },
  { name: 'Grace Hopper', email: 'grace@telar.dev', role: 'Viewer' },
  { name: 'Linus Torvalds', email: 'linus@telar.dev', role: 'Editor' },
  { name: 'Margaret Hamilton', email: 'margaret@telar.dev', role: 'Admin' },
  { name: 'Dennis Ritchie', email: 'dennis@telar.dev', role: 'Viewer' },
]

// DataTable es un SFC genérico (DataTable<TData>); Storybook no tipa bien componentes
// genéricos, así que omitimos `component` del meta y renderizamos vía `render`.
const meta: Meta = {
  title: 'Patterns/DataTable',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Tabla de datos sobre TanStack Table (headless): orden, filtro y paginación, con estados loading/empty/error. Genérica en el tipo de fila.',
      },
    },
  },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => ({
    components: { DataTable },
    setup: () => ({ columns, data }),
    template: `<DataTable :columns="columns" :data="data" caption="Usuarios" :page-size="5" />`,
  }),
}

export const Loading: Story = {
  render: () => ({
    components: { DataTable },
    setup: () => ({ columns }),
    template: `<DataTable :columns="columns" :data="[]" caption="Usuarios" loading />`,
  }),
}

export const Empty: Story = {
  render: () => ({
    components: { DataTable },
    setup: () => ({ columns }),
    template: `<DataTable :columns="columns" :data="[]" caption="Usuarios" empty-message="Aún no hay usuarios." />`,
  }),
}

export const ErrorState: Story = {
  render: () => ({
    components: { DataTable },
    setup: () => ({ columns }),
    template: `<DataTable :columns="columns" :data="[]" caption="Usuarios" error="No se pudo cargar la lista." />`,
  }),
}
