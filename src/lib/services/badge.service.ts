import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface BadgeCriteria {
  type: "streak" | "analyses" | "diary_days" | "hydration_improvement" | "first_analysis"
  threshold: number
}

const BADGE_DEFINITIONS = [
  { slug: "first-analysis", name: "Primer Análisis", description: "Completaste tu primer análisis de piel", icon: "🔬", criteria: { type: "first_analysis", threshold: 1 } },
  { slug: "streak-7", name: "Constante", description: "7 días seguidos registrando en tu diario de piel", icon: "🔥", criteria: { type: "diary_days", threshold: 7 } },
  { slug: "streak-30", name: "Dedicado", description: "30 días seguidos registrando en tu diario de piel", icon: "💪", criteria: { type: "diary_days", threshold: 30 } },
  { slug: "analyses-5", name: "Explorador", description: "Realizaste 5 análisis de piel", icon: "📊", criteria: { type: "analyses", threshold: 5 } },
  { slug: "analyses-10", name: "Experto", description: "Realizaste 10 análisis de piel", icon: "🏅", criteria: { type: "analyses", threshold: 10 } },
  { slug: "analyses-25", name: "Maestro", description: "Realizaste 25 análisis de piel", icon: "👑", criteria: { type: "analyses", threshold: 25 } },
  { slug: "streak-3", name: "Racha Inicial", description: "3 días seguidos de registro en tu diario", icon: "⭐", criteria: { type: "diary_days", threshold: 3 } },
  { slug: "hydration-improvement", name: "Hidratación Mejorada", description: "Mejoraste tu hidratación en 2 análisis consecutivos", icon: "💧", criteria: { type: "hydration_improvement", threshold: 1 } },
] as const

export const BadgeService = {
  async ensureBadges(): Promise<void> {
    for (const def of BADGE_DEFINITIONS) {
      await db.badge.upsert({
        where: { slug: def.slug },
        update: { name: def.name, description: def.description, icon: def.icon, criteria: JSON.stringify(def.criteria) },
        create: { slug: def.slug, name: def.name, description: def.description, icon: def.icon, criteria: JSON.stringify(def.criteria) },
      })
    }
  },

  async checkAndAward(userId: string): Promise<string[]> {
    await this.ensureBadges()
    const badges = await db.badge.findMany({ where: { active: true } })
    const userBadges = await db.userBadge.findMany({ where: { userId }, select: { badgeId: true } })
    const earnedIds = new Set(userBadges.map((b) => b.badgeId))
    const newlyAwarded: string[] = []

    for (const badge of badges) {
      if (earnedIds.has(badge.id)) continue
      const criteria = JSON.parse(badge.criteria) as BadgeCriteria
      const earned = await this.evaluateCriteria(userId, criteria)
      if (earned) {
        try {
          await db.userBadge.create({ data: { userId, badgeId: badge.id } })
          newlyAwarded.push(badge.slug)
        } catch {
          // Duplicate check race — skip
        }
      }
    }
    return newlyAwarded
  },

  async evaluateCriteria(userId: string, criteria: BadgeCriteria): Promise<boolean> {
    switch (criteria.type) {
      case "first_analysis": {
        const count = await db.skinAnalysis.count({ where: { userId } })
        return count >= criteria.threshold
      }
      case "analyses": {
        const count = await db.skinAnalysis.count({ where: { userId } })
        return count >= criteria.threshold
      }
      case "diary_days": {
        const user = await db.user.findUnique({
          where: { id: userId },
          select: { currentStreak: true },
        })
        return (user?.currentStreak ?? 0) >= criteria.threshold
      }
      case "hydration_improvement": {
        // Check if the last 2 analyses show hydration improvement (texture or uniformity)
        const analyses = await db.skinAnalysis.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 2,
          select: { observations: true },
        })
        if (analyses.length < 2) return false
        const parseObs = (obs: string) => {
          try { return JSON.parse(obs) } catch { return {} }
        }
        const obs1 = parseObs(analyses[1].observations)
        const obs2 = parseObs(analyses[0].observations)
        const severityMap: Record<string, number> = { none: 0, leve: 1, bajo: 1, moderado: 2, visible: 3, alto: 4 }
        const getVal = (obj: any, keys: string[]) => {
          for (const k of keys) {
            const v = obj[k]
            if (v) return severityMap[String(v).toLowerCase()] ?? 2
          }
          return 2
        }
        const prevHydration = (getVal(obs1, ["texture", "hidratacion", "hydration"]) + getVal(obs1, ["uniformity", "uniformidad"])) / 2
        const currHydration = (getVal(obs2, ["texture", "hidratacion", "hydration"]) + getVal(obs2, ["uniformity", "uniformidad"])) / 2
        return currHydration < prevHydration
      }
      default:
        return false
    }
  },

  async getUserBadges(userId: string) {
    return db.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    })
  },

  async checkAfterAnalysis(userId: string): Promise<string[]> {
    const awarded = await this.checkAndAward(userId)
    if (awarded.length > 0) {
      logger.info("Badges awarded after analysis", { userId, badges: awarded })
    }
    return awarded
  },
}
