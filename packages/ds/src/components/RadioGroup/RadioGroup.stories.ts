import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import RadioGroup from './RadioGroup.vue'

const options = [
  { label: 'Tarjeta de crédito', value: 'card' },
  { label: 'Transferencia bancaria', value: 'transfer' },
  { label: 'Efectivo', value: 'cash' },
]

const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  args: { label: 'Método de pago', options },
  render: (args) => ({
    components: { RadioGroup },
    setup() {
      const value = ref('card')
      return { args, value }
    },
    template: `<RadioGroup v-bind="args" v-model="value" />`,
  }),
} satisfies Meta<typeof RadioGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true } }
