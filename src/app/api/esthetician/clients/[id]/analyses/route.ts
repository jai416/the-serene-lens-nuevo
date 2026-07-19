import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const { id } = await params

    const client = await db.client.findUnique({ where: { id } })
    if (!client) return error("Cliente no encontrado", 404)
    if (client.estheticianId !== session.user.id) return forbidden()

    const analyses = await db.skinAnalysis.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        skinType: true,
        observations: true,
        createdAt: true,
        userId: true,
      },
    })

    return ok({ client: { id: client.id, name: client.name }, analyses })
  } catch (e) {
    return serverError(e)
  }
}
