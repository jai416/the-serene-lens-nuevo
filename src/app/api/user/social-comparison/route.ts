import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()

  try {
    const referrals = await db.referral.findMany({
      where: {
        referrerId: session.user.id,
        status: "completed",
        referredId: { not: null },
      },
      select: {
        referredId: true,
        referred: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    const friendIds = referrals
      .map((r) => r.referredId)
      .filter((id): id is string => id !== null)

    if (friendIds.length === 0) {
      return ok({
        hasComparison: false,
        message: "Invita a amigos para ver la comparación social.",
        friends: [],
      })
    }

    const friendAnalyses = await db.skinAnalysis.findMany({
      where: { userId: { in: friendIds } },
      orderBy: { createdAt: "desc" },
      select: {
        userId: true,
        skinType: true,
        observations: true,
        createdAt: true,
      },
    })

    const latestByUser = new Map<string, typeof friendAnalyses[0]>()
    for (const a of friendAnalyses) {
      if (a.userId && !latestByUser.has(a.userId)) {
        latestByUser.set(a.userId, a)
      }
    }

    const myLatest = await db.skinAnalysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        skinType: true,
        observations: true,
        createdAt: true,
      },
    })

    const myName = session.user.name || "Tú"

    const comparisons = [
      {
        id: session.user.id,
        name: myName,
        image: session.user.image,
        skinType: myLatest?.skinType || "No analizado",
        observations: myLatest ? JSON.parse(myLatest.observations || "[]") : [],
        isYou: true,
      },
      ...referrals
        .filter((r) => r.referred && latestByUser.has(r.referredId!))
        .map((r) => {
          const analysis = latestByUser.get(r.referredId!)!
          return {
            id: r.referred!.id,
            name: r.referred!.name || "Amigo",
            image: r.referred!.image,
            skinType: analysis.skinType || "No determinado",
            observations: JSON.parse(analysis.observations || "[]"),
            isYou: false,
          }
        }),
    ]

    return ok({
      hasComparison: comparisons.length >= 2,
      myName,
      comparisons,
      friendCount: friendIds.length,
    })
  } catch (e) {
    return serverError(e)
  }
}
