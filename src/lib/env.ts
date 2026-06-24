import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  OPENROUTER_API_KEY: z.string().min(1),
  QVAPAY_UUID: z.string().min(1),
  QVAPAY_SECRET: z.string().min(1),
  QVAPAY_API_URL: z.string().url().default("https://api.qvapay.com"),
  QVAPAY_TAX_RATE: z.string().default("0"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  ROOT_ADMIN_EMAIL: z.string().email().optional(),
  EXCHANGERATE_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_CUP_FALLBACK: z.string().optional(),
  NEXT_PUBLIC_PHOTO_STEPS: z.enum(["2", "4"]).optional(),
  CRON_SECRET: z.string().optional(),
  RAINFOREST_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | null = null

export function getEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const issues = result.error.issues
      .filter((i) => i.code === "invalid_type" && "received" in i && i.received === "undefined")
      .map((i) => i.path.join("."))

    if (issues.length > 0) {
      throw new Error(`Missing required env variables: ${issues.join(", ")}`)
    }

    throw new Error("Invalid environment variables")
  }

  _env = result.data
  return _env
}

export function requireEnv(key: string): string {
  return getEnv()[key as keyof Env] || ""
}

export function optionalEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback
}
