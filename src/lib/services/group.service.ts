import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const GROUP_REQUIRED = 3
export const GROUP_DISCOUNT_PRICE = 2.99
export const GROUP_EXPIRY_DAYS = 30

function generateGroupCode(): string {
  return crypto.randomUUID().replace(/-/g, "").substring(0, 8).toUpperCase()
}

export async function createReferralGroup(userId: string) {
  const existing = await db.groupAnalytics.findFirst({
    where: {
      referrerId: userId,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  })

  if (existing) {
    return { groupId: existing.groupId, code: existing.groupId }
  }

  const code = generateGroupCode()
  const expiresAt = new Date(Date.now() + GROUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await db.groupAnalytics.create({
    data: {
      groupId: code,
      referrerId: userId,
      expiresAt,
    },
  })

  return { groupId: code, code }
}

export async function joinReferralGroup(code: string, newUserId: string) {
  const group = await db.groupAnalytics.findUnique({
    where: { groupId: code },
  })

  if (!group) {
    return { success: false, error: "Grupo no encontrado" }
  }

  if (group.status !== "pending") {
    return { success: false, error: "Este grupo ya está completo o expirado" }
  }

  if (new Date() > group.expiresAt) {
    await db.groupAnalytics.update({
      where: { id: group.id },
      data: { status: "expired" },
    })
    return { success: false, error: "Este grupo ha expirado" }
  }

  if (group.referrerId === newUserId) {
    return { success: false, error: "No puedes unirte a tu propio grupo" }
  }

  const existingReferral = await db.referral.findFirst({
    where: { groupId: code, referredId: newUserId },
  })

  if (existingReferral) {
    return { success: false, error: "Ya estás en este grupo" }
  }

  const referralCount = await db.referral.count({
    where: { groupId: code },
  })

  if (referralCount >= GROUP_REQUIRED) {
    return { success: false, error: "Este grupo ya está completo" }
  }

  await db.referral.create({
    data: {
      referrerId: group.referrerId,
      referredId: newUserId,
      code,
      groupId: code,
      status: "completed",
      discountPrice: GROUP_DISCOUNT_PRICE,
      completedAt: new Date(),
    },
  })

  const newCount = referralCount + 1
  await db.groupAnalytics.update({
    where: { id: group.id },
    data: {
      invitedCount: newCount,
      completedCount: newCount,
      totalRevenue: newCount * GROUP_DISCOUNT_PRICE,
    },
  })

  if (newCount >= GROUP_REQUIRED) {
    await completeGroup(group.id, group.groupId, group.referrerId, newCount)
  }

  return { success: true, groupId: code, count: newCount, completed: newCount >= GROUP_REQUIRED }
}

async function completeGroup(
  groupDbId: string,
  groupId: string,
  referrerId: string,
  completedCount: number,
) {
  try {
    await db.groupAnalytics.update({
      where: { id: groupDbId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    })

    await db.purchasePack.create({
      data: {
        userId: referrerId,
        packType: "FREE_REFERRAL",
        provider: "internal",
        amountUsd: 0,
        amountCup: 0,
        analyses: 1,
        status: "completed",
      },
    })

    const referrer = await db.user.findUnique({
      where: { id: referrerId },
      select: { email: true, name: true },
    })

    if (referrer) {
      await db.notification.create({
        data: {
          userId: referrerId,
          title: "🎉 Grupo completado",
          message: `Tu código ${groupId} completó los 3 referidos. Recibiste un análisis gratis.`,
          link: "/dashboard/referrals",
        },
      })
    }

    logger.info("Referral group completed", {
      groupId,
      referrerId,
      completedCount,
    })
  } catch (e) {
    logger.error("Error completing referral group", { error: e, groupId })
  }
}

export async function getGroupInfo(code: string) {
  const group = await db.groupAnalytics.findUnique({
    where: { groupId: code },
    include: {
      referrer: { select: { name: true } },
    },
  })

  if (!group) return null

  const referrals = await db.referral.findMany({
    where: { groupId: code },
    select: { referredId: true, status: true },
  })

  return {
    groupId: group.groupId,
    referrerName: group.referrer.name || "Un amigo",
    invitedCount: group.invitedCount,
    completedCount: group.completedCount,
    status: group.status,
    isExpired: new Date() > group.expiresAt,
    slotsRemaining: Math.max(0, GROUP_REQUIRED - referrals.length),
    referrals: referrals.length,
  }
}

export async function getUserReferralGroups(userId: string) {
  const groups = await db.groupAnalytics.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
  })

  const result = await Promise.all(
    groups.map(async (g) => {
      const referralCount = await db.referral.count({
        where: { groupId: g.groupId },
      })
      return {
        groupId: g.groupId,
        invitedCount: g.invitedCount,
        completedCount: g.completedCount,
        totalRevenue: g.totalRevenue,
        status: g.status,
        createdAt: g.createdAt,
        completedAt: g.completedAt,
        expiresAt: g.expiresAt,
        referralCount,
        isExpired: new Date() > g.expiresAt,
        slotsRemaining: Math.max(0, GROUP_REQUIRED - referralCount),
      }
    })
  )

  return result
}
