import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { NextRequest, NextResponse } from "next/server"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:knowledge:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    const existing = await db.botKnowledge.findUnique({ where: { id } })
    if (!existing) return error("Entrada no encontrada", 404)

    const entry = await db.botKnowledge.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content && { content: body.content, version: existing.version + 1 }),
        ...(body.category && { category: body.category }),
        ...(body.subcategory !== undefined && { subcategory: body.subcategory }),
        ...(body.source && { source: body.source }),
        ...(body.sourceUrl !== undefined && { sourceUrl: body.sourceUrl }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.keywords && { keywords: body.keywords }),
        ...(body.synonyms && { synonyms: body.synonyms }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        updatedBy: session.user.id,
      },
    })

    return ok({ entry })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { allowed } = await checkRateLimit(`admin:knowledge:${session.user.id}`, 30, 60000)
    if (!allowed) return NextResponse.json({ success: false, error: "Demasiadas solicitudes" }, { status: 429 })

    const { id } = await params
    await db.botKnowledge.delete({ where: { id } })

    return ok({ message: "Entrada eliminada" })
  } catch (e) {
    return serverError(e)
  }
}
