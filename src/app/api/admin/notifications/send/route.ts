import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { logger } from "@/lib/logger"

// Los segmentos comparan el plan BASE: un usuario con plan anual (p.ej.
// PREMIUM_ANNUAL) debe recibir el segmento "premium".
const SEGMENT_FILTERS: Record<string, { plan?: { in: string[] } }> = {
  all: {},
  free: { plan: { in: ["FREE"] } },
  premium: { plan: { in: ["PREMIUM", "PREMIUM_ANNUAL"] } },
  pro: { plan: { in: ["PRO", "PRO_ANNUAL"] } },
  proPlus: { plan: { in: ["PRO_PLUS", "PRO_PLUS_ANNUAL"] } },
  esthetician: { plan: { in: ["ESTHETICIAN", "ESTHETICIAN_ANNUAL"] } },
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    let body: { title?: string; message?: string; segment?: string; link?: string; userId?: string }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido")
    }

    const { title, message, segment = "all", link, userId } = body
    if (!title || !message) {
      return error("Título y mensaje son requeridos")
    }

    if (userId) {
      await db.notification.create({
        data: { userId, title, message, link },
      })
      return ok({ sent: 1, failed: 0 })
    }

    const filter = SEGMENT_FILTERS[segment] || SEGMENT_FILTERS.all
    const users = await db.user.findMany({
      where: filter,
      select: { id: true },
    })

    if (users.length === 0) {
      return ok({ sent: 0, failed: 0, message: "No hay usuarios en ese segmento" })
    }

    let sent = 0
    const batchSize = 100
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      await db.notification.createMany({
        data: batch.map((u) => ({
          userId: u.id,
          title,
          message,
          link,
        })),
      })
      sent += batch.length
    }

    return ok({ sent, failed: 0 })
  } catch (e) {
    logger.error("Notification send error", { error: e })
    return serverError(e)
  }
}
