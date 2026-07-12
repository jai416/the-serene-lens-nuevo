import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:notifications:${session.user.id}`, 10, 60000)
    if (!allowed) return error("Demasiadas solicitudes", 429)

    const notifications = await db.groupAnalytics.findMany({
      where: { status: "completed", notifiedAdmin: false },
      include: {
        referrer: { select: { id: true, email: true, name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 50,
    })

    return ok({
      count: notifications.length,
      notifications: notifications.map((n) => ({
        id: n.id,
        referrerName: n.referrer.name || "Usuario sin nombre",
        referrerEmail: n.referrer.email,
        invitedCount: n.invitedCount,
        completedCount: n.completedCount,
        totalRevenue: n.totalRevenue,
        completedAt: n.completedAt,
        groupId: n.groupId,
      })),
    })
  } catch (e) {
    logger.error("admin notifications GET error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:notifications:${session.user.id}`, 30, 60000)
    if (!allowed) return error("Demasiadas solicitudes", 429)

    const body = await req.json()
    const { notificationId } = body
    if (!notificationId) return error("notificationId requerido")

    await db.groupAnalytics.update({
      where: { id: notificationId },
      data: { notifiedAdmin: true },
    })

    return ok({ success: true })
  } catch (e) {
    logger.error("admin notifications POST error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
