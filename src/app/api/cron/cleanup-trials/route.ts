import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  try {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { count } = await db.user.updateMany({
      where: {
        trialEndsAt: { lt: new Date() },
        plan: { in: ["PREMIUM", "PREMIUM_ANNUAL"] },
        NOT: { role: "ADMIN" },
      },
      data: {
        plan: "FREE",
        analysisLimit: 1,
        analysisUsed: 0,
        trialEndsAt: null,
      },
    })

    if (count > 0) {
      const expired = await db.user.findMany({
        where: { plan: "FREE", trialEndsAt: null, updatedAt: { gte: new Date(Date.now() - 60000) } },
        select: { id: true, name: true },
      })
      for (const u of expired) {
        try {
          const { createTrialEndedNotification } = await import("@/lib/notifications")
          await createTrialEndedNotification(u.id, u.name || "Usuario")
        } catch {}
      }
    }

    const { count: expiredSubs } = await db.subscription.updateMany({
      where: {
        status: "active",
        currentPeriodEnd: { lt: new Date() },
      },
      data: { status: "expired" },
    })

    if (expiredSubs > 0) {
      const expired = await db.subscription.findMany({
        where: { status: "expired", updatedAt: { gte: new Date(Date.now() - 60000) } },
        select: { id: true, userId: true, plan: true },
      })
      const userIds = expired.map(s => s.userId)
      const activeSubs = await db.subscription.findMany({
        where: { userId: { in: userIds }, status: "active" },
        select: { userId: true },
      })
      const activeUserIds = new Set(activeSubs.map(s => s.userId))
      const toDegrade = userIds.filter(id => !activeUserIds.has(id))
      if (toDegrade.length > 0) {
        await db.user.updateMany({
          where: { id: { in: toDegrade } },
          data: { plan: "FREE", analysisLimit: 1 },
        })
      }
    }

    const { count: prunedRateLimits } = await db.rateLimit.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    })

    logger.info("Trial cleanup completed", { degraded: count, expiredSubs, prunedRateLimits })
    return NextResponse.json({ degraded: count, expiredSubs, prunedRateLimits })
  } catch (e) {
    logger.error("Trial cleanup failed", { error: e instanceof Error ? e.message : String(e) })
    return NextResponse.json({ error: "Error" }, { status: 500 })
  }
}
