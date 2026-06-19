import type { User } from '../types/user'

export interface LoginResult {
  token: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (res.status === 401) throw new Error('Credenciales inválidas')
  if (!res.ok) throw new Error(`Error de servidor (HTTP ${res.status})`)
  return (await res.json()) as LoginResult
}
