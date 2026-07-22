import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextResponse } from "next/server"
import { ok, unauthorized, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:stats:${session.user.id}`, 30, 60000)
    if (!allowed) {
      return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })
    }

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
    const paypalRevenue = await db.payment.aggregate({ where: { status: "completed", provider: "paypal" }, _sum: { amount: true } })
    const transferRevenue = await db.payment.aggregate({ where: { status: "completed", provider: "transfer" }, _sum: { amount: true } })
    let transferDirectRevenue = 0
    try {
      const td = await db.transferPayment.aggregate({ where: { status: "activated" }, _sum: { amount: true } })
      transferDirectRevenue = td._sum.amount || 0
    } catch (e) { logger.error("stats: transferDirectRevenue failed", { error: e instanceof Error ? e.message : String(e) }) }
    const paidUsers = await db.user.count({ where: { plan: { not: "FREE" } } })

    const usersYesterday = await db.user.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } })
    const analysesYesterday = await db.skinAnalysis.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } })
    const newUsersThisWeek = await db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } })

    let challenges = 0, diaryEntries = 0, subscriptions = 0, activeSubscriptions = 0
    let packs = 0, completedPacks = 0, comments = 0, featureFlags = 0
    let digitalProducts = 0, guideSales = 0, referralGroups = 0, completedGroups = 0
    try { challenges = await db.challenge.count()     } catch (e) { logger.error("stats: challenge count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { diaryEntries = await db.skinDiary.count() } catch (e) { logger.error("stats: diary count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { subscriptions = await db.subscription.count() } catch (e) { logger.error("stats: subscription count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { activeSubscriptions = await db.subscription.count({ where: { status: "active" } }) } catch (e) { logger.error("stats: activeSubscription count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { packs = await db.purchasePack.count() } catch (e) { logger.error("stats: pack count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { completedPacks = await db.purchasePack.count({ where: { status: "completed" } }) } catch (e) { logger.error("stats: completedPack count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { comments = await db.comment.count() } catch (e) { logger.error("stats: comment count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { featureFlags = await db.appConfig.count() } catch (e) { logger.error("stats: featureFlag count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { digitalProducts = await db.digitalProduct.count() } catch (e) { logger.error("stats: digitalProduct count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { guideSales = await db.digitalProductPurchase.count({ where: { status: "completed" } }) } catch (e) { logger.error("stats: guideSale count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { referralGroups = await db.groupAnalytics.count() } catch (e) { logger.error("stats: referralGroup count failed", { error: e instanceof Error ? e.message : String(e) }) }
    try { completedGroups = await db.groupAnalytics.count({ where: { status: "completed" } }) } catch (e) { logger.error("stats: completedGroup count failed", { error: e instanceof Error ? e.message : String(e) }) }
    let guidesSold = 0
    try { guidesSold = await db.digitalProductPurchase.count({ where: { status: "completed" } }) } catch {}
    let referralRevenue = 0
    try {
      const rr = await db.groupAnalytics.aggregate({ _sum: { totalRevenue: true } })
      referralRevenue = rr._sum.totalRevenue || 0
    } catch {}

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
        revenuePayPal: paypalRevenue._sum.amount || 0,
        revenueTransfer: transferRevenue._sum.amount || 0,
        revenueByProvider: {
          paypal: paypalRevenue._sum.amount || 0,
          transfer: transferRevenue._sum.amount || 0,
          transferDirect: transferDirectRevenue || 0,
        },
        activeUsers: paidUsers, newUsersThisMonth, newUsersThisWeek, newUsersToday,
        analysesThisMonth, analysesToday, conversionRate, paidUsers,
        challenges, diaryEntries, subscriptions, activeSubscriptions,
        packs, completedPacks, comments, featureFlags,
        digitalProducts, guideSales, referralGroups, completedGroups,
        guidesSold, referralRevenue,
        avgAnalysesPerUser: avgAnalyses, churnRate: 0,
        usersYesterday, analysesYesterday,
        timestamp: new Date().toISOString(),
      },
      recentUsers, recentAnalyses, planDistribution, skinTypeDistribution,
    })
  } catch (e) {
    logger.error("Admin stats error:", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
