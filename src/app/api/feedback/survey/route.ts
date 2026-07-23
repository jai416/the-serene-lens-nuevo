import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

const stripHtml = (str: string) => str.replace(/<[^>]*>/g, "")

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión para enviar feedback", 401)

    const rateLimitKey = `survey:${session.user.id}`
    const { allowed } = await checkRateLimit(rateLimitKey, 10, 24 * 60 * 60 * 1000)

    if (!allowed) {
      return error("Demasiadas solicitudes. Intenta de nuevo mañana.", 429)
    }

    const { rating, comment } = await req.json()

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return error("Rating debe ser un número entre 1 y 5")
    }

    const sanitizedComment = typeof comment === "string" ? stripHtml(comment.slice(0, 1000)) : null

    await db.surveyFeedback.create({
      data: {
        userId: session.user.id,
        rating: Math.round(rating),
        comment: sanitizedComment,
      },
    })

    logger.info("Survey feedback submitted", { userId: session.user.id, rating })

    return ok({ success: true })
  } catch (e) {
    logger.error("Survey feedback error", { error: e })
    return error("Error al guardar feedback", 500)
  }
}
