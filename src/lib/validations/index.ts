import { z } from "zod"

export const analysisBodySchema = z.object({
  concerns: z.string().max(1000).optional(),
  age: z.enum(["<18", "18-24", "25-30", "31-40", "41-50", "51+"]).optional(),
  gender: z.enum(["femenino", "masculino", "otro"]).optional(),
  climate: z.enum(["tropical", "seco", "templado", "frio", "humedo"]).optional(),
  routine: z.string().max(2000).optional(),
  language: z.enum(["es", "en"]).optional(),
}).strict()

export const feedbackSchema = z.object({
  analysisId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  wouldRecommend: z.boolean(),
}).strict()

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
}).strict()

export const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
}).strict()

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
  name: z.string().min(1).max(100),
}).strict()

export const clinicSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  logo: z.string().url().optional(),
}).strict()
