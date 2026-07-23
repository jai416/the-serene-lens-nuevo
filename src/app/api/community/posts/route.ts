import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")
    const cursor = url.searchParams.get("cursor")

    const where: any = {}
    if (groupId) where.groupId = groupId

    const posts = await db.communityPost.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true, plan: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 51,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    })

    const hasMore = posts.length > 50
    const items = hasMore ? posts.slice(0, 50) : posts

    return ok({ posts: items, nextCursor: hasMore ? items[items.length - 1]?.id : null })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

    const { title, content, groupId, category } = await req.json()
    if (!title || !content) {
      return error("title y content son requeridos")
    }

    const post = await db.communityPost.create({
      data: {
        userId: session.user.id,
        title,
        content,
        groupId: groupId || null,
        category: category || "general",
      },
      include: {
        user: { select: { id: true, name: true, image: true, plan: true } },
      },
    })

    return ok({ post }, 201)
  } catch (e) {
    return serverError(e)
  }
}
