import type { User } from '../types/user'

// Capa de servicios (SAD §6): única que conoce URLs y forma del payload.
// Devuelve tipos de dominio. Si el backend cambiara la forma, el adaptador vive aquí.
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error(`No se pudo cargar usuarios (HTTP ${res.status})`)
  return (await res.json()) as User[]
}
