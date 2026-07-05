import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const { allowed } = await checkRateLimit(`admin:analytics:${admin.id}`, 10, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }

    const [totalPayments, qvapayPayments, recentSubscriptions, recentPacks] = await db.$transaction([
      db.payment.findMany({ where: { status: "completed" } }),
      db.payment.findMany({ where: { status: "completed", provider: "qvapay" } }),
      db.subscription.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
      db.purchasePack.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, email: true } } },
      }),
    ])

    const userPlans = await db.user.groupBy({
      by: ["plan"],
      _count: true,
      orderBy: { plan: "asc" },
    })

    const revenueByProvider = {
      qvapay: qvapayPayments.reduce((sum, p) => sum + p.amount, 0),
      total: totalPayments.reduce((sum, p) => sum + p.amount, 0),
    }

    const planDistribution = Object.fromEntries(
      userPlans.map((u) => [u.plan, u._count]),
    )

    const totalUsers = userPlans.reduce((sum, u) => sum + u._count, 0)
    const paidUsers = userPlans
      .filter((u) => u.plan !== "FREE")
      .reduce((sum, u) => sum + u._count, 0)
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0

    return ok({
      revenueByProvider,
      planDistribution,
      totalUsers,
      paidUsers,
      conversionRate: Math.round(conversionRate * 100) / 100,
      recentSubscriptions,
      recentPacks,
    })
  } catch (e) {
    return serverError(e)
  }
}
