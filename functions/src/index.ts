// API REST de Tejido en Cloud Functions (ADR-017). Reemplaza a MSW como backend real:
// la app sigue hablando el MISMO contrato REST (`/api/users`…), así la capa de services
// (SAD §6) y los tests con MSW no cambian. Los datos viven en Firestore; el acceso se
// protege verificando el ID token de Firebase Auth (ADR-018).
import { onRequest } from 'firebase-functions/v2/https'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'

initializeApp()
const db = getFirestore()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

// El path llega con el prefijo /api en Hosting (rewrite) y puede o no en el proxy de dev:
// lo normalizamos quitándolo, así las rutas se declaran sin él y funcionan en ambos.
app.use((req, _res, next) => {
  req.url = req.url.replace(/^\/api(?=\/|$)/, '') || '/'
  next()
})

interface AuthedRequest extends Request {
  uid?: string
}

// Verifica el ID token de Firebase Auth (Bearer). Bajo emulador, el Admin SDK valida
// contra el emulador de Auth automáticamente (FIREBASE_AUTH_EMULATOR_HOST).
async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const match = /^Bearer (.+)$/.exec(req.header('Authorization') ?? '')
  if (!match) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }
  try {
    const decoded = await getAuth().verifyIdToken(match[1])
    req.uid = decoded.uid
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

type UserDoc = {
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

const usersCol = () => db.collection('users')

app.get('/users', requireAuth, async (_req, res) => {
  const snap = await usersCol().orderBy('createdAt').get()
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
})

app.get('/users/:id', requireAuth, async (req, res) => {
  const doc = await usersCol().doc(req.params.id).get()
  if (!doc.exists) {
    res.status(404).json({ error: 'No encontrado' })
    return
  }
  res.json({ id: doc.id, ...doc.data() })
})

app.put('/users/:id', requireAuth, async (req, res) => {
  const ref = usersCol().doc(req.params.id)
  const doc = await ref.get()
  if (!doc.exists) {
    res.status(404).json({ error: 'No encontrado' })
    return
  }
  // Solo se aceptan campos del dominio (nunca el id ni campos arbitrarios).
  const body = req.body as Partial<UserDoc>
  const patch: Partial<UserDoc> = {}
  if (typeof body.name === 'string') patch.name = body.name
  if (typeof body.email === 'string') patch.email = body.email
  if (typeof body.role === 'string') patch.role = body.role
  if (typeof body.status === 'string') patch.status = body.status
  await ref.set(patch, { merge: true })
  const updated = await ref.get()
  res.json({ id: updated.id, ...updated.data() })
})

// Una sola función HTTP expone toda la API; Hosting reescribe /api/** hacia ella.
export const api = onRequest({ region: 'us-central1' }, app)
