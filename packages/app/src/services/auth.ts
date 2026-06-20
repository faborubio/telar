import { BACKEND } from '../config'
import type { User } from '../types/user'

export interface LoginResult {
  token: string
  user: User
}

// ── API pública del service (SAD §6): la misma forma en ambos backends. ──

export async function login(email: string, password: string): Promise<LoginResult> {
  return BACKEND === 'firebase' ? loginFirebase(email, password) : loginMock(email, password)
}

export async function logout(): Promise<void> {
  if (BACKEND !== 'firebase') return
  const { signOut } = await import('firebase/auth')
  const { auth } = await import('../firebase')
  await signOut(auth)
}

/** Token a enviar como Bearer a la API. Mock: el token fake en localStorage; Firebase: el ID token. */
export async function getToken(): Promise<string | null> {
  if (BACKEND === 'firebase') {
    const { auth } = await import('../firebase')
    return (await auth.currentUser?.getIdToken()) ?? null
  }
  return localStorage.getItem('telar-token')
}

/** Restaura la sesión al cargar (Firebase persiste el login). Mock no necesita restauración. */
export async function restoreSession(): Promise<LoginResult | null> {
  if (BACKEND !== 'firebase') return null
  const { onAuthStateChanged } = await import('firebase/auth')
  const { auth } = await import('../firebase')
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      unsub()
      if (!fbUser) {
        resolve(null)
        return
      }
      void fbUser.getIdToken().then(async (token) => {
        const user = await fetchProfile(fbUser.uid, token)
        resolve(user ? { token, user } : null)
      })
    })
  })
}

// ── Implementación mock (MSW, contrato REST /api/login) ──

async function loginMock(email: string, password: string): Promise<LoginResult> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (res.status === 401) throw new Error('Credenciales inválidas')
  if (!res.ok) throw new Error(`Error de servidor (HTTP ${res.status})`)
  return (await res.json()) as LoginResult
}

// ── Implementación Firebase (Firebase Auth + perfil de dominio desde el backend) ──

async function loginFirebase(email: string, password: string): Promise<LoginResult> {
  const { signInWithEmailAndPassword } = await import('firebase/auth')
  const { auth } = await import('../firebase')
  let token: string
  let uid: string
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    token = await cred.user.getIdToken()
    uid = cred.user.uid
  } catch {
    throw new Error('Credenciales inválidas')
  }
  const user = await fetchProfile(uid, token)
  if (!user) throw new Error('No se pudo cargar el perfil del usuario')
  return { token, user }
}

// El rol/estado no viven en Firebase Auth: el perfil de dominio se lee del backend.
async function fetchProfile(uid: string, token: string): Promise<User | null> {
  const res = await fetch(`/api/users/${uid}`, { headers: { Authorization: `Bearer ${token}` } })
  return res.ok ? ((await res.json()) as User) : null
}
