import { NextRequest } from "next/server"
import { registerUser } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { registerSchema } from "@/lib/validations"
import { error, ok, serverError } from "@/lib/api-response"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`register:${ip}`, 10, 24 * 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiados registros desde esta dirección. Intenta de nuevo más tarde.", 429)
    }

    const body = await req.json()

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { name, email, password } = parsed.data

    const result = await registerUser(email, password, name)
    if (result.error) {
      return error(result.error, 400)
    }

    return ok({ userId: result.user?.id })
  } catch {
    return serverError()
  }
}
