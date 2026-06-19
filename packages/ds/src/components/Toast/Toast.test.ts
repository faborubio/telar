import { render, screen, waitFor } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect, afterEach } from 'vitest'
import ToastProvider from './ToastProvider.vue'
import { useToast } from '../../composables/useToast'

const { toast, clear } = useToast()

afterEach(() => clear())

describe('Toast', () => {
  it('muestra título y descripción al invocar toast()', async () => {
    render(ToastProvider)
    toast({ title: 'Guardado', description: 'Tus cambios se guardaron' })
    expect(await screen.findByText('Guardado')).toBeTruthy()
    expect(screen.getByText('Tus cambios se guardaron')).toBeTruthy()
  })

  it('se cierra con el botón de cierre (quita el toast de la cola)', async () => {
    const user = userEvent.setup()
    render(ToastProvider)
    toast({ title: 'Cerrable' })
    await screen.findByText('Cerrable')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    await waitFor(() => expect(screen.queryByText('Cerrable')).toBeNull())
  })

  it('no tiene violaciones de accesibilidad con un toast visible', async () => {
    render(ToastProvider)
    toast({ title: 'Notificación', description: 'Mensaje accesible', variant: 'success' })
    await screen.findByText('Notificación')
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
