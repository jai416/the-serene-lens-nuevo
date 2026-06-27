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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const users = await db.user.count()
    const analyses = await db.skinAnalysis.count()
    const payments = await db.payment.count()
    const completedPayments = await db.payment.count({ where: { status: "completed" } })
    const messages = await db.contactMessage.count()
    const posts = await db.blogPost.count()
    const products = await db.product.count()
    const unreadMessages = await db.contactMessage.count({ where: { read: false } })

    const newUsersThisMonth = await db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } })
    const newUsersToday = await db.user.count({ where: { createdAt: { gte: todayStart } } })
    const analysesToday = await db.skinAnalysis.count({ where: { createdAt: { gte: todayStart } } })
    const analysesThisMonth = await db.skinAnalysis.count({ where: { createdAt: { gte: thirtyDaysAgo } } })

    const revenueResult = await db.payment.aggregate({ where: { status: "completed" }, _sum: { amount: true } })
    const qvapayRevenue = await db.payment.aggregate({ where: { status: "completed", provider: "qvapay" }, _sum: { amount: true } })
    const paidUsers = await db.user.count({ where: { plan: { not: "FREE" } } })

    const usersYesterday = await db.user.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } })
    const analysesYesterday = await db.skinAnalysis.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } })
    const newUsersThisWeek = await db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } })

    let challenges = 0, diaryEntries = 0, subscriptions = 0, activeSubscriptions = 0
    let packs = 0, completedPacks = 0, comments = 0, featureFlags = 0
    let digitalProducts = 0, guideSales = 0, referralGroups = 0, completedGroups = 0
    try { challenges = await db.challenge.count() } catch (e) { console.error("stats: challenge count failed", e) }
    try { diaryEntries = await db.skinDiary.count() } catch (e) { console.error("stats: diary count failed", e) }
    try { subscriptions = await db.subscription.count() } catch (e) { console.error("stats: subscription count failed", e) }
    try { activeSubscriptions = await db.subscription.count({ where: { status: "active" } }) } catch (e) { console.error("stats: activeSubscription count failed", e) }
    try { packs = await db.purchasePack.count() } catch (e) { console.error("stats: pack count failed", e) }
    try { completedPacks = await db.purchasePack.count({ where: { status: "completed" } }) } catch (e) { console.error("stats: completedPack count failed", e) }
    try { comments = await db.comment.count() } catch (e) { console.error("stats: comment count failed", e) }
    try { featureFlags = await db.appConfig.count() } catch (e) { console.error("stats: featureFlag count failed", e) }
    try { digitalProducts = await db.digitalProduct.count() } catch (e) { console.error("stats: digitalProduct count failed", e) }
    try { guideSales = await db.digitalProductPurchase.count({ where: { status: "completed" } }) } catch (e) { console.error("stats: guideSale count failed", e) }
    try { referralGroups = await db.groupAnalytics.count() } catch (e) { console.error("stats: referralGroup count failed", e) }
    try { completedGroups = await db.groupAnalytics.count({ where: { status: "completed" } }) } catch (e) { console.error("stats: completedGroup count failed", e) }

    const conversionRate = users > 0 ? Math.round((paidUsers / users) * 10000) / 100 : 0
    const avgAnalyses = users > 0 ? Math.round((analyses / users) * 100) / 100 : 0

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

    let planDistribution: Record<string, number> = {}
    try {
      const plans = await db.user.groupBy({ by: ["plan"], _count: true })
      planDistribution = Object.fromEntries(plans.map((p) => [p.plan, p._count]))
    } catch {}

    let skinTypeDistribution: Record<string, number> = {}
    try {
      const types = await db.skinAnalysis.groupBy({ by: ["skinType"], _count: true })
      skinTypeDistribution = Object.fromEntries(types.map((s) => [s.skinType || "unknown", s._count]))
    } catch {}

    return ok({
      stats: {
        users, analyses, payments, completedPayments,
        pendingPayments: payments - completedPayments,
        messages, unreadMessages, posts, products,
        revenue: revenueResult._sum.amount || 0,
        revenueQvaPay: qvapayRevenue._sum.amount || 0,
        activeUsers: paidUsers, newUsersThisMonth, newUsersThisWeek, newUsersToday,
        analysesThisMonth, analysesToday, conversionRate, paidUsers,
        challenges, diaryEntries, subscriptions, activeSubscriptions,
        packs, completedPacks, comments, featureFlags,
        digitalProducts, guideSales, referralGroups, completedGroups,
        avgAnalysesPerUser: avgAnalyses, churnRate: 0,
        usersYesterday, analysesYesterday,
        timestamp: new Date().toISOString(),
      },
      recentUsers, recentAnalyses, planDistribution, skinTypeDistribution,
    })
  } catch (e) {
    console.error("Admin stats error:", e)
    return serverError(e)
  }
}
