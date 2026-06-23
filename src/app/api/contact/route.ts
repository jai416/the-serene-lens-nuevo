import { NextRequest } from "next/server"
import { contactSchema } from "@/lib/validation"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"

const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "")

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rateLimitKey = `contact:${ip}`
    const { allowed } = await checkRateLimit(rateLimitKey, 5, 60 * 60 * 1000)

    if (!allowed) {
      return error("Demasiadas solicitudes. Intenta de nuevo más tarde.", 429)
    }

    const body = await req.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return error(parsed.error.issues[0]?.message || "Datos inválidos")
    }

    const sanitizedData = {
      name: stripHtml(parsed.data.name),
      email: stripHtml(parsed.data.email),
      subject: stripHtml(parsed.data.subject),
      message: stripHtml(parsed.data.message),
    }

    const message = await db.contactMessage.create({
      data: sanitizedData,
    })

    return ok({ message: "Mensaje enviado correctamente" })
  } catch (e) {
    return serverError(e)
  }
}
