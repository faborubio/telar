import type { Meta, StoryObj } from '@storybook/vue3'
import { useForm } from 'vee-validate'
import FormField from './FormField.vue'

const meta = {
  title: 'Patterns/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: { name: 'email', label: 'Correo' },
  parameters: {
    docs: {
      description: {
        component:
          'Campo de formulario que conecta vee-validate (headless) con el Input del DS. Debe vivir dentro de un componente que llame a `useForm`. El esquema (p. ej. Zod) lo aporta el consumidor.',
      },
    },
  },
  render: () => ({
    components: { FormField },
    setup() {
      useForm({
        validationSchema: {
          email: (v: string) => (v && String(v).includes('@') ? true : 'Correo inválido'),
        },
      })
      return {}
    },
    template: `
      <form style="max-width: 24rem">
        <FormField
          name="email"
          label="Correo"
          type="email"
          placeholder="tu@correo.com"
          description="Escribe un correo sin @ y haz blur para ver el error."
        />
      </form>
    `,
  }),
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
