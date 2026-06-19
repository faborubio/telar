import type { Meta, StoryObj } from '@storybook/vue3'
import Button from './Button.vue'

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'select', options: ['button', 'submit', 'reset'] },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
    block: { control: 'boolean' },
    default: { control: 'text', description: 'Contenido (slot por defecto).' },
    onClick: { action: 'click' },
  },
  args: { default: 'Botón', variant: 'primary', size: 'md' },
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `<Button v-bind="args" @click="args.onClick">{{ args.default }}</Button>`,
  }),
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
export const Secondary: Story = { args: { variant: 'secondary' } }
export const Danger: Story = { args: { variant: 'danger', default: 'Borrar' } }
export const Loading: Story = { args: { loading: true, default: 'Enviando…' } }
export const Disabled: Story = { args: { disabled: true } }

export const Sizes: Story = {
  render: (args) => ({
    components: { Button },
    setup: () => ({ args }),
    template: `
      <div style="display:flex; gap:1rem; align-items:center;">
        <Button v-bind="args" size="sm">Pequeño</Button>
        <Button v-bind="args" size="md">Mediano</Button>
        <Button v-bind="args" size="lg">Grande</Button>
      </div>
    `,
  }),
}
