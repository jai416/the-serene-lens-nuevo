import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return unauthorized()

  const { allowed } = await checkRateLimit(`admin:notifications:${admin.id}`, 10, 60000)
  if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

  try {
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
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return unauthorized()

  try {
    const body = await req.json()
    const { allowed } = await checkRateLimit(`admin:notifications:${admin.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }
    const { notificationId } = body

    if (!notificationId) return error("notificationId requerido")

    await db.groupAnalytics.update({
      where: { id: notificationId },
      data: { notifiedAdmin: true },
    })

    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
