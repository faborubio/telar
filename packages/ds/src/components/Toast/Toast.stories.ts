import type { Meta, StoryObj } from '@storybook/vue3'
import ToastProvider from './ToastProvider.vue'
import Button from '../Button/Button.vue'
import Stack from '../../primitives/Stack.vue'
import { useToast } from '../../composables/useToast'

const meta = {
  title: 'Components/Toast',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Se monta una vez (envuelve la app). Las notificaciones se disparan con `useToast().toast(...)`.',
      },
    },
  },
  render: () => ({
    components: { ToastProvider, Button, Stack },
    setup() {
      const { toast } = useToast()
      return { toast }
    },
    template: `
      <ToastProvider>
        <Stack direction="row" gap="3">
          <Button @click="toast({ title: 'Información', description: 'Un mensaje neutro.' })">Info</Button>
          <Button variant="secondary" @click="toast({ title: 'Guardado', description: 'Cambios guardados.', variant: 'success' })">Éxito</Button>
          <Button variant="danger" @click="toast({ title: 'Error', description: 'Algo salió mal.', variant: 'danger' })">Error</Button>
        </Stack>
      </ToastProvider>
    `,
  }),
} satisfies Meta<typeof ToastProvider>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}
