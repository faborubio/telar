import { z } from 'zod'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const userEditSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().min(1, 'El correo es obligatorio').regex(EMAIL, 'Correo inválido'),
  role: z.enum(['admin', 'editor', 'viewer']),
  status: z.enum(['active', 'suspended']),
})

export type UserEditValues = z.infer<typeof userEditSchema>
