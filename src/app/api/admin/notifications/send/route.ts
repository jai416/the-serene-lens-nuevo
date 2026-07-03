import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1),
  segment: z.enum(["all", "free", "premium", "pro", "proPlus", "new"]),
  link: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const rl = await checkRateLimit(`admin-notification:${session.user.id}`, 5, 60 * 60 * 1000)
    if (!rl.allowed) {
      return error("Demasiados envíos. Intenta más tarde.", 429)
    }

    const body = await request.json()
    const parsed = sendNotificationSchema.safeParse(body)

    if (!parsed.success) {
      return error("Datos inválidos", 400)
    }

    const { title, message, segment, link } = parsed.data

    let where: Record<string, unknown> = {}

    switch (segment) {
      case "all":
        where = {}
        break
      case "free":
        where = { plan: "FREE" }
        break
      case "premium":
        where = { plan: "PREMIUM" }
        break
      case "pro":
        where = { plan: "PRO" }
        break
      case "proPlus":
        where = { plan: "PRO_PLUS" }
        break
      case "new": {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        where = { createdAt: { gte: thirtyDaysAgo } }
        break
      }
    }

    const users = await db.user.findMany({
      where,
      select: { id: true },
    })

    if (users.length === 0) {
      return ok({ sent: 0, failed: 0 })
    }

    let sent = 0
    let failed = 0

    for (const user of users) {
      try {
        await db.notification.create({
          data: {
            userId: user.id,
            title,
            message,
            link: link || null,
          },
        })
        sent++
      } catch {
        failed++
      }
    }

    logger.info("Admin notification sent", {
      title,
      segment,
      recipientCount: users.length,
      sent,
      failed,
      adminId: session.user.id,
    })

    return ok({ sent, failed })
  } catch {
    return serverError()
  }
}
