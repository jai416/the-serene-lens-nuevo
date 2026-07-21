import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const url = new URL(req.url)
    const groupId = url.searchParams.get("groupId")

    const where: any = {}
    if (groupId) where.groupId = groupId

    const posts = await db.communityPost.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, image: true, plan: true } },
        _count: { select: { comments: true, reactions: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return ok({ posts })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

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
