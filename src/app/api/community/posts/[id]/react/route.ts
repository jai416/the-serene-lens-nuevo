import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, notFound } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

const VALID_TYPES = ["LIKE", "LOVE", "HELPFUL", "INSIGHTFUL", "INTERESTING"]

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("No autorizado", 401)
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const { id } = await params
    const post = await db.communityPost.findUnique({ where: { id } })
    if (!post) return notFound()

    const body = await req.json()
    const type = body?.type || "LIKE"
    if (!VALID_TYPES.includes(type)) return error("Tipo de reacción inválido", 400)

    const existing = await db.postReaction.findUnique({
      where: { postId_userId_type: { postId: id, userId: session.user.id, type } },
    })

    if (existing) {
      await db.postReaction.delete({ where: { id: existing.id } })

      if (type === "LIKE") {
        await db.communityPost.update({ where: { id }, data: { likes: { decrement: 1 } } })
      }

      const count = await db.postReaction.count({ where: { postId: id, type } })
      return ok({ action: "removed", type, count })
    }

    await db.postReaction.create({
      data: { postId: id, userId: session.user.id, type },
    })

    if (type === "LIKE") {
      await db.communityPost.update({ where: { id }, data: { likes: { increment: 1 } } })
    }

    const count = await db.postReaction.count({ where: { postId: id, type } })
    return ok({ action: "added", type, count }, 201)
  } catch (e) {
    return serverError(e)
  }
}
