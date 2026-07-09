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
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo").optional(),
}).strict()

export const clinicSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  phone: z.string().max(50).optional(),
  logo: z.string().url().optional(),
}).strict()

export const diaryEntrySchema = z.object({
  date: z.string().min(1),
  feeling: z.number().int().min(1).max(5),
  notes: z.string().max(500).optional(),
}).strict()

export const challengeCompleteSchema = z.object({
  challengeId: z.string().min(1),
}).strict()

export const challengeCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  points: z.number().int().min(1).max(1000).default(10),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
  active: z.boolean().default(true),
}).strict()

export const adminBlogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  content: z.string().min(1),
  image: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  tags: z.string().max(500).optional(),
  published: z.boolean().optional(),
  readTime: z.number().int().min(1).max(600).optional(),
}).strict()

export const adminBlogUpdateSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  image: z.string().max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.string().max(500).optional(),
  published: z.boolean().optional(),
  readTime: z.number().int().min(1).max(600).optional(),
}).strict()

export const adminProductSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().min(1),
  shortDesc: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  category: z.string().min(1).max(100),
  skinTypes: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  ingredients: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
}).strict()

export const adminProductUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  shortDesc: z.string().max(500).optional(),
  image: z.string().max(500).optional(),
  category: z.string().min(1).max(100).optional(),
  skinTypes: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  ingredients: z.string().max(5000).optional(),
  isActive: z.boolean().optional(),
}).strict()

export const adminUserUpdateSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["USER", "VALIDATOR", "ADMIN"]).optional(),
  plan: z.enum(["FREE", "PREMIUM", "PRO", "PRO_PLUS", "ESTHETICIAN"]).optional(),
  telegramId: z.string().nullable().optional(),
}).strict()

export const adminMessageUpdateSchema = z.object({
  id: z.string().min(1),
  read: z.boolean(),
}).strict()

export const adminMessageReplySchema = z.object({
  id: z.string().min(1),
  reply: z.string().min(1).max(5000),
}).strict()

export const adminDeleteSchema = z.object({
  id: z.string().min(1),
}).strict()
