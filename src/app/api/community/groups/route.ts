import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const lastAnalysis = await db.skinAnalysis.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: { skinType: true },
    })

    const groups = await db.communityGroup.findMany({
      include: {
        _count: { select: { members: true, posts: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Mark which group matches user's skin type
    const userSkinType = lastAnalysis?.skinType?.toLowerCase() || ""
    const enriched = groups.map((g) => ({
      ...g,
      isRecommended: g.slug === userSkinType || (userSkinType && g.name.toLowerCase().includes(userSkinType)),
    }))

    return ok({ groups: enriched })
  } catch {
    return serverError()
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { name, slug, description, image } = await req.json()
    if (!name || !slug || !description) {
      return error("name, slug y description son requeridos")
    }

    const group = await db.communityGroup.create({
      data: {
        name,
        slug,
        description,
        image,
        createdById: session.user.id,
      },
    })

    // Auto-join the creator
    await db.communityMember.create({
      data: { groupId: group.id, userId: session.user.id },
    }).catch(() => {})

    return ok({ group }, 201)
  } catch {
    return serverError()
  }
}
