import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const challenges = await db.challenge.findMany({
      where: { active: true },
      include: {
        userChallenges: {
          where: { userId: session.user.id },
          select: { completed: true, completedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const userChallenges = await db.userChallenge.findMany({
      where: { userId: session.user.id, completed: true },
      include: { challenge: { select: { points: true } } },
    })

    const totalPoints = userChallenges.reduce((sum, uc) => sum + (uc.challenge?.points || 0), 0)

    const result = challenges.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      points: c.points,
      frequency: c.frequency,
      completed: c.userChallenges[0]?.completed || false,
      completedAt: c.userChallenges[0]?.completedAt || null,
    }))

    return ok({
      challenges: result,
      totalPoints,
    })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("Debes iniciar sesión", 401)

    const { challengeId } = await req.json()
    if (!challengeId) return error("challengeId es requerido")

    const challenge = await db.challenge.findUnique({ where: { id: challengeId } })
    if (!challenge) return error("Desafío no encontrado", 404)

    const existing = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId: session.user.id, challengeId } },
    })

    if (existing?.completed) return error("Ya completaste este desafío")

    const userChallenge = await db.userChallenge.upsert({
      where: { userId_challengeId: { userId: session.user.id, challengeId } },
      update: { completed: true, completedAt: new Date() },
      create: { userId: session.user.id, challengeId, completed: true, completedAt: new Date() },
    })

    return ok({ userChallenge, pointsEarned: challenge.points })
  } catch (e) {
    return serverError(e)
  }
}
