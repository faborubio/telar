import { render, screen } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { useForm } from 'vee-validate'
import FormField from './FormField.vue'

// Harness con contexto de formulario para probar la integración con vee-validate.
const Harness = defineComponent({
  setup() {
    const { validate } = useForm({
      validationSchema: {
        email: (v: string) => (v && String(v).includes('@') ? true : 'Correo inválido'),
      },
    })
    return () =>
      h('form', [
        h(FormField, { name: 'email', label: 'Correo' }),
        h('button', { type: 'button', onClick: () => validate() }, 'validar'),
      ])
  },
})

describe('FormField', () => {
  it('renderiza el label y actualiza el valor al escribir', async () => {
    const user = userEvent.setup()
    render(FormField, { props: { name: 'nombre', label: 'Nombre' } })
    const input = screen.getByLabelText('Nombre') as HTMLInputElement
    await user.type(input, 'Ada')
    expect(input.value).toBe('Ada')
  })

  it('muestra el mensaje de error del esquema del formulario', async () => {
    const user = userEvent.setup()
    render(Harness)
    await user.click(screen.getByRole('button', { name: 'validar' }))
    expect(await screen.findByText('Correo inválido')).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(FormField, { props: { name: 'correo', label: 'Correo' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
