import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { id } = await params
    await db.botKnowledge.delete({ where: { id } })

    return ok({ message: "Entrada eliminada" })
  } catch (e) {
    return serverError(e)
  }
}
