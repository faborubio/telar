import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import Input from './Input.vue'

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    type: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
  },
  args: { label: 'Correo', placeholder: 'tu@correo.com', size: 'md' },
  render: (args) => ({
    components: { Input },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `<div style="max-width:24rem"><Input v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithDescription: Story = {
  args: { description: 'Usa tu correo corporativo.' },
}
export const WithError: Story = {
  args: { error: 'Ese correo no es válido.' },
}
export const Required: Story = { args: { required: true } }
export const Disabled: Story = { args: { disabled: true, placeholder: 'No editable' } }
