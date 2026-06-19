import { render, screen, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, it, expect } from 'vitest'
import DataTable from './DataTable.vue'

interface Row {
  name: string
  role: string
}

const columns = [
  { accessorKey: 'name', header: 'Nombre' },
  { accessorKey: 'role', header: 'Rol' },
]

const data: Row[] = [
  { name: 'Ada Lovelace', role: 'Admin' },
  { name: 'Alan Turing', role: 'Editor' },
  { name: 'Grace Hopper', role: 'Viewer' },
]

describe('DataTable', () => {
  it('renderiza encabezados y filas', () => {
    render(DataTable, { props: { columns, data, caption: 'Usuarios' } })
    expect(screen.getByRole('columnheader', { name: /Nombre/ })).toBeTruthy()
    expect(screen.getByText('Ada Lovelace')).toBeTruthy()
    expect(screen.getByText('Grace Hopper')).toBeTruthy()
  })

  it('filtra por el texto de búsqueda', async () => {
    const user = userEvent.setup()
    render(DataTable, { props: { columns, data, caption: 'Usuarios', filterLabel: 'Buscar' } })
    await user.type(screen.getByLabelText('Buscar'), 'Turing')
    expect(screen.getByText('Alan Turing')).toBeTruthy()
    expect(screen.queryByText('Ada Lovelace')).toBeNull()
  })

  it('ordena al hacer click en el encabezado (refleja aria-sort)', async () => {
    const user = userEvent.setup()
    render(DataTable, { props: { columns, data, caption: 'Usuarios' } })
    const header = screen.getByRole('columnheader', { name: /Nombre/ })
    await user.click(within(header).getByRole('button'))
    expect(header.getAttribute('aria-sort')).toBe('ascending')
  })

  it('muestra el estado de carga', () => {
    render(DataTable, { props: { columns, data: [], caption: 'Usuarios', loading: true } })
    expect(screen.getByText('Cargando…')).toBeTruthy()
  })

  it('muestra el estado de error y emite retry', async () => {
    const user = userEvent.setup()
    const { emitted } = render(DataTable, {
      props: { columns, data: [], caption: 'Usuarios', error: 'Fallo de red' },
    })
    expect(screen.getByText('Fallo de red')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(emitted().retry).toHaveLength(1)
  })

  it('muestra el estado vacío', () => {
    render(DataTable, {
      props: { columns, data: [], caption: 'Usuarios', emptyMessage: 'Sin usuarios' },
    })
    expect(screen.getByText('Sin usuarios')).toBeTruthy()
  })

  it('pagina cuando hay más filas que pageSize', async () => {
    const user = userEvent.setup()
    const many: Row[] = Array.from({ length: 12 }, (_, i) => ({
      name: `User ${i}`,
      role: 'Viewer',
    }))
    render(DataTable, { props: { columns, data: many, caption: 'Usuarios', pageSize: 5 } })
    expect(screen.getByText('User 0')).toBeTruthy()
    expect(screen.queryByText('User 5')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('User 5')).toBeTruthy()
  })

  it('no tiene violaciones de accesibilidad', async () => {
    const { container } = render(DataTable, { props: { columns, data, caption: 'Usuarios' } })
    expect(await axe(container)).toHaveNoViolations()
  })
})
