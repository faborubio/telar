// Semilla de dominio para el backend (Firestore + Auth del emulador). Es la misma data que
// servía MSW, ahora como fuente para sembrar el backend real (ADR-017).
export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  status: 'active' | 'suspended'
  createdAt: string
}

/** Clave demo para todos los usuarios sembrados en el emulador de Auth. */
export const DEMO_PASSWORD = 'telar123'

export const seedUsers: User[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@telar.dev', role: 'admin', status: 'active', createdAt: '2025-01-12' },
  { id: '2', name: 'Alan Turing', email: 'alan@telar.dev', role: 'editor', status: 'active', createdAt: '2025-02-03' },
  { id: '3', name: 'Grace Hopper', email: 'grace@telar.dev', role: 'viewer', status: 'suspended', createdAt: '2025-02-20' },
  { id: '4', name: 'Linus Torvalds', email: 'linus@telar.dev', role: 'editor', status: 'active', createdAt: '2025-03-08' },
  { id: '5', name: 'Margaret Hamilton', email: 'margaret@telar.dev', role: 'admin', status: 'active', createdAt: '2025-03-19' },
  { id: '6', name: 'Dennis Ritchie', email: 'dennis@telar.dev', role: 'viewer', status: 'active', createdAt: '2025-04-01' },
  { id: '7', name: 'Barbara Liskov', email: 'barbara@telar.dev', role: 'admin', status: 'active', createdAt: '2025-04-15' },
  { id: '8', name: 'Edsger Dijkstra', email: 'edsger@telar.dev', role: 'editor', status: 'suspended', createdAt: '2025-05-02' },
  { id: '9', name: 'Donald Knuth', email: 'donald@telar.dev', role: 'viewer', status: 'active', createdAt: '2025-05-21' },
  { id: '10', name: 'Katherine Johnson', email: 'katherine@telar.dev', role: 'editor', status: 'active', createdAt: '2025-06-09' },
  { id: '11', name: 'Tim Berners-Lee', email: 'tim@telar.dev', role: 'admin', status: 'active', createdAt: '2025-06-18' },
  { id: '12', name: 'Radia Perlman', email: 'radia@telar.dev', role: 'viewer', status: 'active', createdAt: '2025-06-25' },
]
