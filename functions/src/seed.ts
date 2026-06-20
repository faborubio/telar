// Siembra el backend del EMULADOR: documentos en Firestore + usuarios en Auth (para poder
// loguearse con email del seed + DEMO_PASSWORD). Se ejecuta con las env del emulador
// (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST) — ver el script `seed:emulators`.
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { DEMO_PASSWORD, seedUsers } from './data'

// Por defecto apunta a los emuladores locales (así `pnpm -C functions seed` funciona sin
// configurar env). NUNCA siembra cloud real salvo que se pasen hosts/proyecto explícitos.
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
process.env.GCLOUD_PROJECT ??= 'demo-telar'

initializeApp({ projectId: process.env.GCLOUD_PROJECT })

const db = getFirestore()
const auth = getAuth()

async function main(): Promise<void> {
  for (const user of seedUsers) {
    const { id, name, email, role, status, createdAt } = user
    await db.collection('users').doc(id).set({ name, email, role, status, createdAt })
    try {
      await auth.createUser({ uid: id, email, password: DEMO_PASSWORD, displayName: name })
    } catch (e) {
      // Idempotente: si ya existe (re-seed), se ignora.
      const code = (e as { code?: string }).code
      if (code !== 'auth/uid-already-exists' && code !== 'auth/email-already-exists') throw e
    }
  }
  console.log(`Sembrados ${seedUsers.length} usuarios (Firestore + Auth). Clave: ${DEMO_PASSWORD}`)
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err)
    process.exit(1)
  },
)
