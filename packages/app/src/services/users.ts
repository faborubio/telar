import type { User } from '../types/user'
import { getToken } from './auth'

// Capa de servicios (SAD §6): única que conoce URLs y forma del payload. El mismo contrato
// REST (/api/users) lo sirve MSW en tests/E2E o Cloud Functions en dev/prod (ADR-017): este
// código no cambia entre backends. Adjunta el Bearer (MSW lo ignora; Functions lo verifica).
async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('/api/users', { headers: await authHeaders() })
  if (!res.ok) throw new Error(`No se pudo cargar usuarios (HTTP ${res.status})`)
  return (await res.json()) as User[]
}

export async function fetchUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`No se encontró el usuario (HTTP ${res.status})`)
  return (await res.json()) as User
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User> {
  const res = await fetch(`/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`No se pudo guardar (HTTP ${res.status})`)
  return (await res.json()) as User
}
