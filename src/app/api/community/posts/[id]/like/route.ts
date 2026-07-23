import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (!validateCsrf(_req)) return error("CSRF token inválido", 403)

    const { id } = await params

    const post = await db.communityPost.findUnique({ where: { id }, select: { id: true, userId: true } })
    if (!post) return error("Publicación no encontrada", 404)

    if (post.userId === session.user.id) return error("No puedes dar me gusta a tu propia publicación", 400)

    await db.communityPost.update({ where: { id }, data: { likes: { increment: 1 } } })

    return ok({ liked: true })
  } catch (e) {
    return serverError(e)
  }
}
