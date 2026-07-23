import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: Request) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()

    const body = await req.json().catch(() => ({}))
    const telegramId = body.telegramId?.trim()

    if (!telegramId) return error("El chatId de Telegram es requerido")

    const existing = await db.user.findFirst({ where: { telegramId } })
    if (existing && existing.id !== session.user.id) {
      return error("Este chatId ya está vinculado a otro usuario")
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { telegramId },
    })

    return ok({ message: "Cuenta vinculada correctamente" })
  } catch (e) {
    logger.error("Link Telegram error:", e)
    return serverError(e)
  }
}