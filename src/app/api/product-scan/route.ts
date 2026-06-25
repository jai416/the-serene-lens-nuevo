import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { scanProductIngredients } from "@/lib/openrouter"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { logger } from "@/lib/logger"

const alarmistTerms = [
  "tóxico", "toxina", "veneno", "venenoso", "cancerígeno", "carcinógeno",
  "mortal", "peligroso", "dañino", "nocivo", "letal",
]

function sanitizeSummary(summary: string): string {
  let sanitized = summary
  alarmistTerms.forEach((term) => {
    const regex = new RegExp(term, "gi")
    sanitized = sanitized.replace(regex, (match) => `[${match}]`)
  })
  return sanitized
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return unauthorized("Inicia sesión para escanear productos")
  }

  try {
    const formData = await req.formData()
    const file = formData.get("image") as File | null

    if (!file) return error("Imagen requerida")

    if (file.size > 10 * 1024 * 1024) {
      return error("La imagen no debe superar 10MB")
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    const result = await scanProductIngredients(base64)

    if (result.summary) {
      result.summary = sanitizeSummary(result.summary as string)
    }

    return ok({ result })
  } catch (e) {
    logger.error("Product scan error", { error: e, userId: session.user.id })
    return serverError(e)
  }
}
