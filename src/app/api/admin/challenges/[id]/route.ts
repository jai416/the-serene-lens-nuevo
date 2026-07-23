import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { ok, error, unauthorized, notFound, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:challenges:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body) return error("Cuerpo de request inválido")

    const challenge = await db.challenge.findUnique({ where: { id } })
    if (!challenge) return notFound()

    const updated = await db.challenge.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.points !== undefined && { points: body.points }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.active !== undefined && { active: body.active }),
      },
    })

    return ok(updated)
  } catch (e) {
    logger.error("Challenge PATCH error:", e)
    return serverError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:challenges:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    const challenge = await db.challenge.findUnique({ where: { id } })
    if (!challenge) return notFound()

    await db.challenge.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    logger.error("Challenge DELETE error:", e)
    return serverError(e)
  }
}
