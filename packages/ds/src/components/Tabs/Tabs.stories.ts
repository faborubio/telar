import type { Meta, StoryObj } from '@storybook/vue3'
import Tabs from './Tabs.vue'

const tabs = [
  { label: 'Resumen', value: 'overview' },
  { label: 'Actividad', value: 'activity' },
  { label: 'Ajustes', value: 'settings' },
]

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  args: { tabs, label: 'Secciones de la cuenta' },
  render: (args) => ({
    components: { Tabs },
    setup: () => ({ args }),
    template: `
      <Tabs v-bind="args">
        <template #overview><p>Vista general de la cuenta.</p></template>
        <template #activity><p>Últimos movimientos y eventos.</p></template>
        <template #settings><p>Preferencias y configuración.</p></template>
      </Tabs>
    `,
  }),
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
