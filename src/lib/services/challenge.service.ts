import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export class ChallengeError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = "ChallengeError"
  }
}

export const ChallengeService = {
  async getActiveChallenges(userId: string) {
    const challenges = await db.challenge.findMany({
      where: { active: true },
      include: {
        userChallenges: {
          where: { userId },
          select: { completed: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const userChallenges = await db.userChallenge.findMany({
      where: { userId, completed: true },
      include: { challenge: { select: { points: true } } },
    })

    const totalPoints = userChallenges.reduce((sum, uc) => sum + (uc.challenge?.points || 0), 0)

    return {
      challenges: challenges.map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        points: c.points,
        frequency: c.frequency,
        completed: c.userChallenges[0]?.completed || false,
        completedAt: c.userChallenges[0]?.completedAt || null,
      })),
      totalPoints,
    }
  },

  async completeChallenge(userId: string, challengeId: string) {
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) throw new ChallengeError("Desafío no encontrado", "NOT_FOUND")
    if (!challenge.active) throw new ChallengeError("Este desafío no está activo", "INACTIVE")

    const existing = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    })

    if (existing?.completed) throw new ChallengeError("Ya completaste este desafío", "ALREADY_COMPLETED")

    const userChallenge = await db.userChallenge.upsert({
      where: { userId_challengeId: { userId, challengeId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId, challengeId, completed: true, completedAt: new Date() },
    })

    logger.info("Challenge completed", { userId, challengeId, points: challenge.points })
    return { userChallenge, pointsEarned: challenge.points }
  },

  async createChallenge(data: { title: string; description: string; points?: number; frequency?: string }) {
    const challenge = await db.challenge.create({
      data: {
        title: data.title,
        description: data.description,
        points: data.points ?? 10,
        frequency: data.frequency ?? "weekly",
      },
    })

    logger.info("Challenge created", { challengeId: challenge.id, title: challenge.title })
    return challenge
  },

  async deactivateChallenge(challengeId: string) {
    const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) throw new ChallengeError("Desafío no encontrado", "NOT_FOUND")

    await db.challenge.update({
      where: { id: challengeId },
      data: { active: false },
    })

    logger.info("Challenge deactivated", { challengeId })
  },

  async getUserStats(userId: string) {
    const completed = await db.userChallenge.count({
      where: { userId, completed: true },
    })

    const pending = await db.challenge.count({
      where: {
        active: true,
        userChallenges: { none: { userId, completed: true } },
      },
    })

    const points = await db.userChallenge.findMany({
      where: { userId, completed: true },
      include: { challenge: { select: { points: true } } },
    })

    const totalPoints = points.reduce((sum, uc) => sum + (uc.challenge?.points || 0), 0)

    return { completed, pending, totalPoints }
  },
}
