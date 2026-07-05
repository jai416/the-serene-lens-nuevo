import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return ok({ analyses: [] })
    }

    const analyses = await db.skinAnalysis.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        skinType: true,
        concerns: true,
        createdAt: true,
        feedback: {
          select: {
            id: true,
            rating: true,
            wouldRecommend: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return ok({ analyses })
  } catch (e) {
    return serverError(e)
  }
}
