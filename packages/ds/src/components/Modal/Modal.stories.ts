import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import Modal from './Modal.vue'
import Button from '../Button/Button.vue'

const meta = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  args: {
    title: 'Eliminar cuenta',
    description: 'Esta acción es permanente y no se puede deshacer.',
  },
  render: (args) => ({
    components: { Modal, Button },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
      <div>
        <Button @click="open = true">Abrir modal</Button>
        <Modal v-bind="args" v-model:open="open">
          <p>¿Seguro que quieres continuar? Escribe tu confirmación abajo.</p>
          <template #footer>
            <Button variant="secondary" @click="open = false">Cancelar</Button>
            <Button variant="danger" @click="open = false">Eliminar</Button>
          </template>
        </Modal>
      </div>
    `,
  }),
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutDescription: Story = { args: { description: undefined } }
