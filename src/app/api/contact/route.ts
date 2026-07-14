import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    const { allowed } = await checkRateLimit(`contact:${ip}`, 5, 3600000)
    if (!allowed) return error("Demasiados mensajes. Intenta en una hora.", 429)

    const { name, email, message } = await req.json().catch(() => ({}))
    if (!name || !email || !message) return error("Nombre, email y mensaje requeridos", 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error("Email inválido", 400)

    const sanitized = (s: string) => s.replace(/<[^>]*>/g, "").trim()

    await db.contactMessage.create({
      data: {
        name: sanitized(name),
        email: sanitized(email),
        message: sanitized(message),
      },
    })

    logger.info("Contact message received", { name, email })
    return ok({ success: true })
  } catch (e) {
    logger.error("Contact form error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
