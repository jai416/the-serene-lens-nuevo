import { z } from "zod"

export const emailSchema = z.string().email("Email inválido")

export const passwordSchema = z
  .string()
  .min(6, "Mínimo 6 caracteres")

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, "Mínimo 2 caracteres").optional(),
})

export const contactSchema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  email: emailSchema,
  subject: z.string().min(3, "Asunto requerido"),
  message: z.string().min(10, "Mensaje muy corto"),
})

export const analysisQuestionSchema = z.object({
  skinType: z.string().optional(),
  concerns: z.string().optional(),
})
