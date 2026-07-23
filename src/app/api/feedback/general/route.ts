import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { type, message } = await req.json()
    if (!message || typeof message !== "string" || message.length > 2000) {
      return error("Mensaje inválido (máx 2000 caracteres)")
    }
    if (!["suggestion", "bug", "praise"].includes(type)) {
      return error("Tipo de feedback inválido")
    }

    await db.surveyFeedback.create({
      data: {
        userId: session.user.id,
        rating: type === "praise" ? 5 : type === "suggestion" ? 3 : 1,
        comment: message,
        source: `feedback:${type}`,
      },
    })

    return ok({ success: true })
  } catch {
    return serverError()
  }
}
