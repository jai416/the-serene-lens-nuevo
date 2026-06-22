import { db } from "@/lib/db"
import { getPlan, PACK_EXPIRY_DAYS } from "@/lib/pricing"

function getPackCutoff(): Date {
  return new Date(Date.now() - PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}

export async function getUsageInfo(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      analysisLimit: true,
      analysisUsed: true,
      analysisResetAt: true,
    },
  })

  if (!user) return null

  const plan = getPlan(user.plan)
  const isUnlimited = plan?.analysesPerMonth === -1

  const cutoff = getPackCutoff()
  const packAnalyses = await db.purchasePack.aggregate({
    where: { userId, status: "completed", createdAt: { gte: cutoff } },
    _sum: { analyses: true },
  })

  const packUsage = await db.usageTracking.count({
    where: { userId, type: "pack" },
  })

  const monthlyLimit = isUnlimited ? Infinity : (plan?.analysesPerMonth ?? 1)
  const monthlyUsed = isUnlimited ? 0 : user.analysisUsed
  const monthlyRemaining = isUnlimited ? Infinity : Math.max(0, monthlyLimit - monthlyUsed)

  const packTotal = packAnalyses._sum.analyses ?? 0
  const packRemaining = Math.max(0, packTotal - packUsage)

  return {
    plan: user.plan,
    isUnlimited,
    monthlyLimit,
    monthlyUsed,
    monthlyRemaining,
    packTotal,
    packRemaining,
    totalRemaining: isUnlimited ? Infinity : monthlyRemaining + packRemaining,
  }
}

export async function checkAndDeductUsage(userId: string): Promise<{ allowed: boolean; error?: string }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      analysisLimit: true,
      analysisUsed: true,
      analysisResetAt: true,
    },
  })

  if (!user) return { allowed: false, error: "Usuario no encontrado" }

  const plan = getPlan(user.plan)
  const isUnlimited = plan?.analysesPerMonth === -1

  if (isUnlimited) {
    await db.usageTracking.create({
      data: { userId, type: "analysis" },
    })
    return { allowed: true }
  }

  const now = new Date()
  if (user.analysisResetAt && now > user.analysisResetAt) {
    await db.user.update({
      where: { id: userId },
      data: { analysisUsed: 0, analysisResetAt: null },
    })
  }

  const monthlyLimit = plan?.analysesPerMonth ?? 1
  const monthlyRemaining = Math.max(0, monthlyLimit - user.analysisUsed)

  const cutoff = getPackCutoff()
  const packResult = await db.purchasePack.aggregate({
    where: { userId, status: "completed", createdAt: { gte: cutoff } },
    _sum: { analyses: true },
  })
  const packTotal = packResult._sum.analyses ?? 0
  const packUsage = await db.usageTracking.count({
    where: { userId, type: "pack" },
  })
  const packRemaining = Math.max(0, packTotal - packUsage)

  const totalRemaining = monthlyRemaining + packRemaining

  if (totalRemaining <= 0) {
    return { allowed: false, error: "Has alcanzado tu límite de análisis. Adquiere un plan o pack para continuar." }
  }

  if (packRemaining > 0) {
    await db.usageTracking.create({
      data: { userId, type: "pack" },
    })
  } else {
    await db.user.update({
      where: { id: userId },
      data: { analysisUsed: { increment: 1 } },
    })
  }

  return { allowed: true }
}
