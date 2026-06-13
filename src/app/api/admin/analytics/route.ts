import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const [totalPayments, stripePayments, qvapayPayments] = await Promise.all([
      db.payment.findMany({ where: { status: "completed" } }),
      db.payment.findMany({ where: { status: "completed", provider: "stripe" } }),
      db.payment.findMany({ where: { status: "completed", provider: "qvapay" } }),
    ])

    const revenueByProvider = {
      stripe: stripePayments.reduce((sum, p) => sum + p.amount, 0),
      qvapay: qvapayPayments.reduce((sum, p) => sum + p.amount, 0),
      total: totalPayments.reduce((sum, p) => sum + p.amount, 0),
    }

    const userPlans = await db.user.groupBy({
      by: ["plan"],
      _count: true,
    })

    const planDistribution = Object.fromEntries(
      userPlans.map((u) => [u.plan, u._count]),
    )

    const totalUsers = userPlans.reduce((sum, u) => sum + u._count, 0)
    const paidUsers = userPlans
      .filter((u) => u.plan !== "FREE")
      .reduce((sum, u) => sum + u._count, 0)
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0

    const recentSubscriptions = await db.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    })

    const recentPacks = await db.purchasePack.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true, email: true } } },
    })

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
