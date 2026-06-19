import type { Meta, StoryObj } from '@storybook/vue3'
import PageHeader from './PageHeader.vue'
import Button from '../../components/Button/Button.vue'

const meta = {
  title: 'Patterns/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  args: {
    title: 'Usuarios',
    description: 'Gestiona el acceso y los roles del equipo.',
  },
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActions: Story = {
  render: (args) => ({
    components: { PageHeader, Button },
    setup: () => ({ args }),
    template: `
      <PageHeader v-bind="args">
        <template #actions>
          <Button variant="secondary">Exportar</Button>
          <Button>Nuevo usuario</Button>
        </template>
      </PageHeader>
    `,
  }),
}

export const TitleOnly: Story = { args: { description: undefined } }
