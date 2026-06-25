import { db } from "@/lib/db"

export async function getUsageStats(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, analysisLimit: true, analysisUsed: true, analysisResetAt: true },
  })

  if (!user) return null

  const packs = await db.purchasePack.findMany({
    where: {
      userId,
      status: "completed",
      createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
    },
    select: { analyses: true },
  })

  const packAnalyses = packs.reduce((sum, p) => sum + p.analyses, 0)

  return {
    plan: user.plan,
    monthlyLimit: user.analysisLimit,
    monthlyUsed: user.analysisUsed,
    packAnalyses,
    remaining: user.plan === "PREMIUM" || user.plan === "PRO" || user.plan === "PRO_PLUS" || user.plan === "ESTHETICIAN"
      ? null
      : Math.max(0, user.analysisLimit - user.analysisUsed) + packAnalyses,
    resetAt: user.analysisResetAt,
  }
}

export async function createB2bUser(email: string, name: string, clinicName: string): Promise<boolean> {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return false

  await db.user.create({
    data: {
      email,
      name,
      role: "USER",
      plan: "ESTHETICIAN",
      analysisLimit: 0,
    },
  })

  return true
}

export async function generateB2bReport(userId: string, clinicId: string) {
  const clinic = await db.clinic.findUnique({ where: { id: clinicId } })
  if (!clinic) return null

  const analyses = await db.skinAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return { clinic, analyses }
}
