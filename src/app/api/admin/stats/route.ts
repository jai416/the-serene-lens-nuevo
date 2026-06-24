import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      users,
      analyses,
      payments,
      messages,
      posts,
      products,
      completedPayments,
      unreadMessages,
      activeSessions,
      newUsersThisMonth,
      analysesThisMonth,
      newUsersThisWeek,
      newUsersToday,
      analysesToday,
      revenue,
      qvapayRevenue,
      paidUsers,
    ] = await Promise.all([
      db.user.count(),
      db.skinAnalysis.count(),
      db.payment.count(),
      db.contactMessage.count(),
      db.blogPost.count(),
      db.product.count(),
      db.payment.count({ where: { status: "completed" } }),
      db.contactMessage.count({ where: { read: false } }),
      db.session.count({ where: { expires: { gte: new Date() } } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.skinAnalysis.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: todayStart } } }),
      db.skinAnalysis.count({ where: { createdAt: { gte: todayStart } } }),
      db.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "completed", provider: "qvapay" }, _sum: { amount: true } }),
      db.user.count({ where: { plan: { not: "FREE" } } }),
    ])

    const conversionRate = users > 0 ? Math.round((paidUsers / users) * 10000) / 100 : 0

    const [recentUsers, recentAnalyses, planDistribution] = await Promise.all([
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, plan: true, createdAt: true },
      }),
      db.skinAnalysis.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, skinType: true, createdAt: true, user: { select: { name: true, email: true } } },
      }),
      db.user.groupBy({ by: ["plan"], _count: true }),
    ])

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
        revenue: revenue._sum.amount || 0,
        revenueQvaPay: qvapayRevenue._sum.amount || 0,
        activeUsers: activeSessions,
        newUsersThisMonth,
        newUsersThisWeek,
        newUsersToday,
        analysesThisMonth,
        analysesToday,
        conversionRate,
        paidUsers,
        timestamp: new Date().toISOString(),
      },
      recentUsers,
      recentAnalyses,
      planDistribution: Object.fromEntries(planDistribution.map((p) => [p.plan, p._count])),
    })
  } catch (e) {
    return serverError(e)
  }
}
