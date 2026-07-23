import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, serverError, unauthorized } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { createWebNotification } from "@/lib/notifications"

const SEGMENT_FILTERS: Record<string, any> = {
  all: {},
  free: { plan: "FREE" },
  premium: { plan: "PREMIUM" },
  pro: { plan: "PRO" },
  proPlus: { plan: "PRO_PLUS" },
  new: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") return unauthorized()

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const rl = await checkRateLimit(`admin-emails-send:${ip}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiados envíos. Intenta más tarde.", 429)
    }

    let body: { segment?: string; subject?: string; message?: string; userIds?: string[] }
    try {
      body = await req.json()
    } catch {
      return error("Cuerpo de solicitud inválido", 400)
    }

    const { segment, subject, message, userIds } = body
    if (!subject || !message) {
      return error("Faltan campos requeridos: subject, message", 400)
    }

    const baseFilter = (segment && SEGMENT_FILTERS[segment]) ? SEGMENT_FILTERS[segment] : {}
    const userFilter = userIds && Array.isArray(userIds) ? { id: { in: userIds } } : baseFilter

    const users = await db.user.findMany({
      where: userFilter,
      select: { id: true },
    })

    let sent = 0
    for (const user of users) {
      try {
        await createWebNotification(user.id, subject, message)
        sent++
      } catch {}
    }

    return ok({ sent, failed: users.length - sent, total: users.length, info: "Notificaciones web enviadas (email próximamente)" })
  } catch (e) {
    logger.error("Admin notification send error:", e)
    return serverError(e)
  }
}
