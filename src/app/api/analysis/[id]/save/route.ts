import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, notFound, serverError } from "@/lib/api-response"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { id } = await params

    const existing = await db.skinAnalysis.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) return notFound("Análisis no encontrado")

    if (existing.userId && existing.userId !== session.user.id) {
      return unauthorized()
    }

    await db.skinAnalysis.update({
      where: { id },
      data: { userId: session.user.id },
    })

    return ok({ saved: true })
  } catch (e) {
    return serverError(e)
  }
}
