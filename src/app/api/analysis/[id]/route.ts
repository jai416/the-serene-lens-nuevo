import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, notFound, unauthorized, serverError } from "@/lib/api-response"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    const analysis = await db.skinAnalysis.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        skinType: true,
        concerns: true,
        observations: true,
        recommendations: true,
        routine: true,
        createdAt: true,
      },
    })

    if (!analysis) return notFound("Análisis no encontrado")

    if (!session?.user || (analysis.userId && analysis.userId !== session.user.id)) {
      return unauthorized()
    }

    return ok({ analysis })
  } catch (e) {
    return serverError(e)
  }
}
