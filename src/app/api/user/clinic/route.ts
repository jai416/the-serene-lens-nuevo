import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
    })

    const analyses = await db.skinAnalysis.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, skinType: true, createdAt: true },
    })

    return ok({ clinic, analyses })
  } catch {
    return serverError()
  }
}
