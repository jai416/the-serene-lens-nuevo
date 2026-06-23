import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [users, analyses, payments, messages, posts, products] = await Promise.all([
      db.user.count(),
      db.skinAnalysis.count(),
      db.payment.count(),
      db.contactMessage.count(),
      db.blogPost.count(),
      db.product.count(),
    ])

    const [completedPayments, unreadMessages, activeUsers, newUsersThisMonth, analysesThisMonth, newUsersThisWeek] = await Promise.all([
      db.payment.count({ where: { status: "completed" } }),
      db.contactMessage.count({ where: { read: false } }),
      db.session.count({ where: { expires: { gte: new Date() } } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.skinAnalysis.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ])

    const [revenue, qvapayRevenue] = await Promise.all([
      db.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "completed", provider: "qvapay" }, _sum: { amount: true } }),
    ])

    const totalRevenue = revenue._sum.amount || 0
    const qvapayTotal = qvapayRevenue._sum.amount || 0

    const paidUsers = await db.user.count({ where: { plan: { not: "FREE" } } })
    const conversionRate = users > 0 ? Math.round((paidUsers / users) * 10000) / 100 : 0

    const recentUsers = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, plan: true, createdAt: true },
    })

    const recentAnalyses = await db.skinAnalysis.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, skinType: true, createdAt: true, user: { select: { name: true, email: true } } },
    })

    const planDistribution = await db.user.groupBy({
      by: ["plan"],
      _count: true,
    })

    return ok({
      stats: {
        users,
        analyses,
        payments,
        completedPayments,
        pendingPayments: payments - completedPayments,
        messages,
        unreadMessages,
        posts,
        products,
        revenue: totalRevenue,
        revenueQvaPay: qvapayTotal,
        activeUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        analysesThisMonth,
        conversionRate,
        paidUsers,
      },
      recentUsers,
      recentAnalyses,
      planDistribution: Object.fromEntries(planDistribution.map((p) => [p.plan, p._count])),
    })
  } catch (e) {
    return serverError(e)
  }
}
