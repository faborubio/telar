import { z } from 'zod'

// El schema de Zod es a la vez fuente de validación y de tipos (ADR-010).
// Email por regex para ser estable entre versiones de Zod.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const loginSchema = z.object({
  email: z.string().min(1, 'El correo es obligatorio').regex(EMAIL, 'Correo inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export type LoginValues = z.infer<typeof loginSchema>
