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

    const [totalAgg, paypalAgg, recentSubscriptions, recentPacks] = await db.$transaction([
      // aggregate en vez de findMany: con el tiempo la tabla de pagos crece y
      // traerla entera para sumar agotaba la memoria del tier free
      db.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "completed", provider: "paypal" }, _sum: { amount: true } }),
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
      paypal: paypalAgg._sum.amount ?? 0,
      total: totalAgg._sum.amount ?? 0,
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
