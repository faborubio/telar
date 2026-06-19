import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import Select from './Select.vue'

const options = [
  { label: 'Argentina', value: 'ar' },
  { label: 'Chile', value: 'cl' },
  { label: 'México', value: 'mx' },
  { label: 'España', value: 'es' },
]

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  args: { label: 'País', placeholder: 'Selecciona un país', options },
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `<div style="max-width:20rem"><Select v-bind="args" v-model="value" /></div>`,
  }),
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Preselected: Story = {
  render: (args) => ({
    components: { Select },
    setup() {
      const value = ref('mx')
      return { args, value }
    },
    template: `<div style="max-width:20rem"><Select v-bind="args" v-model="value" /></div>`,
  }),
}
export const Disabled: Story = { args: { disabled: true } }
