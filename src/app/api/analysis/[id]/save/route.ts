import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, notFound, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { id } = await params

    const existing = await db.skinAnalysis.findUnique({
      where: { id },
      select: { userId: true, clientId: true },
    })

    if (!existing) return notFound("Análisis no encontrado")

    // Un análisis con userId null pertenece a un cliente de una esteticista:
    // solo su esteticista puede reclamarlo (reclamar sin ser = IDOR).
    if (existing.userId) {
      if (existing.userId !== session.user.id) return unauthorized()
      return ok({ saved: true })
    }

    if (!existing.clientId) return notFound("Análisis no encontrado")

    const client = await db.client.findUnique({
      where: { id: existing.clientId },
      select: { estheticianId: true },
    })
    if (!client || client.estheticianId !== session.user.id) return unauthorized()

    await db.skinAnalysis.update({
      where: { id },
      data: { userId: session.user.id },
    })

    return ok({ saved: true })
  } catch (e) {
    return serverError(e)
  }
}
