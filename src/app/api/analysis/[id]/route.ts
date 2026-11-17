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
        clientId: true,
        skinType: true,
        concerns: true,
        observations: true,
        recommendations: true,
        routine: true,
        createdAt: true,
      },
    })

    if (!analysis) return notFound("Análisis no encontrado")
    if (!session?.user) return unauthorized()

    if (analysis.userId) {
      if (analysis.userId !== session.user.id) return unauthorized()
    } else {
      // userId null = análisis de un cliente de esteticista: solo su esteticista lo ve
      if (!analysis.clientId) return notFound("Análisis no encontrado")
      const client = await db.client.findUnique({
        where: { id: analysis.clientId },
        select: { estheticianId: true },
      })
      if (!client || client.estheticianId !== session.user.id) return unauthorized()
    }

    return ok({ analysis })
  } catch (e) {
    return serverError(e)
  }
}
