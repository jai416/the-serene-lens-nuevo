import { NextResponse } from "next/server"
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

    return NextResponse.json(
      { success: true, data: { analyses } },
      {
        headers: {
          "Cache-Control": "private, max-age=10, s-maxage=30",
        },
      }
    )
  } catch (e) {
    return serverError(e)
  }
}
