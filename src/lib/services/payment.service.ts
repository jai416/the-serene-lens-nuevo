import { db } from "@/lib/db"
import { PACK_EXPIRY_DAYS } from "@/lib/pricing"
import { getCUPRate } from "@/lib/cup-rate"
import { sendEmail, buildPaymentSuccessEmail } from "@/lib/email"

export const PaymentService = {
  async getUserPayments(userId: string) {
    return db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
  },

  async getUserSubscription(userId: string) {
    return db.subscription.findFirst({
      where: { userId, status: "active" },
    })
  },

  async getUsageStats(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { plan: true, analysisLimit: true, analysisUsed: true, analysisResetAt: true },
    })
    if (!user) return null

    const packs = await db.purchasePack.findMany({
      where: { userId, status: "completed", createdAt: { gte: new Date(Date.now() - PACK_EXPIRY_DAYS * 86400000) } },
      select: { analyses: true },
    })

    const packAnalyses = packs.reduce((sum, p) => sum + p.analyses, 0)
    const isUnlimited = ["PREMIUM", "PREMIUM_ANNUAL", "PRO", "PRO_ANNUAL", "PRO_PLUS", "PRO_PLUS_ANNUAL", "ESTHETICIAN", "ESTHETICIAN_ANNUAL"].includes(user.plan)

    return {
      plan: user.plan,
      monthlyLimit: user.analysisLimit,
      monthlyUsed: user.analysisUsed,
      packAnalyses,
      remaining: isUnlimited ? null : Math.max(0, user.analysisLimit - user.analysisUsed) + packAnalyses,
      resetAt: user.analysisResetAt,
    }
  },

  async upgradeToEsthetician(userId: string) {
    return db.user.update({
      where: { id: userId },
      data: { plan: "ESTHETICIAN", analysisLimit: 0 },
    })
  },
}

export async function handleSuccessfulPlanPayment(
  userId: string,
  plan: string,
  provider: string,
  meta: { qvapayId?: string; amount: number },
) {
  const packMap: Record<string, number> = { BASIC: 3, POPULAR: 5, PACK_10: 10, ADVANCED: 15, PACK_25: 25 }
  const packAnalyses = packMap[plan]
  const cupRate = await getCUPRate()
  const isAnnual = plan.includes("_ANNUAL")
  const periodDays = isAnnual ? 365 : 30

  if (packAnalyses) {
    await db.purchasePack.create({
      data: {
        userId,
        packType: plan,
        analyses: packAnalyses,
        amountUsd: meta.amount,
        amountCup: meta.amount * cupRate,
        provider,
        status: "completed",
      },
    })
  } else {
    const limitMap: Record<string, number> = {
      PREMIUM: 0, PREMIUM_ANNUAL: 0,
      PRO: 0, PRO_ANNUAL: 0,
      PRO_PLUS: 0, PRO_PLUS_ANNUAL: 0,
      ESTHETICIAN: 0, ESTHETICIAN_ANNUAL: 0,
    }
    const analysisLimit = limitMap[plan] ?? 5

    await db.user.update({
      where: { id: userId },
      data: { plan, analysisLimit, analysisUsed: 0, analysisResetAt: new Date(Date.now() + periodDays * 86400000) },
    })

    const existing = await db.subscription.findFirst({ where: { userId, status: "active" } })
    if (existing) {
      await db.subscription.update({
        where: { id: existing.id },
        data: { plan, status: "active", currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + periodDays * 86400000) },
      })
    } else {
      await db.subscription.create({
        data: {
          userId,
          plan,
          status: "active",
          provider,
          qvapayInvoiceId: meta.qvapayId || null,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + periodDays * 86400000),
        },
      })
    }
  }

  await db.payment.create({
    data: {
      userId,
      plan,
      amount: meta.amount,
      provider,
      qvapayId: meta.qvapayId,
      status: "completed",
    },
  })

  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (user?.email) {
    const { subject, html } = buildPaymentSuccessEmail(plan, meta.amount)
    sendEmail({ to: user.email, subject, html }).catch((e) =>
      console.error("Payment success email failed to send:", e),
    )
  }
}
