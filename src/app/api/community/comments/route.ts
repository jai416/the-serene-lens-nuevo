import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const url = new URL(req.url)
    const postId = url.searchParams.get("postId")
    if (!postId) return error("postId es requerido")

    const comments = await db.comment.findMany({
      where: { postId, approved: true },
      include: {
        user: { select: { id: true, name: true, image: true, plan: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    return ok({ comments })
  } catch {
    return serverError()
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { postId, content } = await req.json()
    if (!postId || !content) return error("postId y content son requeridos")

    const comment = await db.comment.create({
      data: { postId, userId: session.user.id, content },
      include: {
        user: { select: { id: true, name: true, image: true, plan: true } },
      },
    })

    return ok({ comment }, 201)
  } catch {
    return serverError()
  }
}
