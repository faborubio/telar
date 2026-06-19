// Tipos de dominio (SAD §6). Los servicios devuelven estos tipos, no DTOs crudos.
export type UserRole = 'admin' | 'editor' | 'viewer'
export type UserStatus = 'active' | 'suspended'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  /** Fecha de alta en ISO 8601. */
  createdAt: string
}
