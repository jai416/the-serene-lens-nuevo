import { NextRequest } from "next/server"
import { cache } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

const getUserSkinType = cache(async (userId: string): Promise<string> => {
  const analysis = await db.skinAnalysis.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { skinType: true },
  })
  return analysis?.skinType?.toLowerCase() || ""
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const [userSkinType, groups] = await Promise.all([
      getUserSkinType(session.user.id),
      db.communityGroup.findMany({
        include: {
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ])

    const enriched = groups.map((g) => ({
      ...g,
      isRecommended: g.slug === userSkinType || (userSkinType && g.name.toLowerCase().includes(userSkinType)),
    }))

    return ok({ groups: enriched })
  } catch {
    return serverError()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)

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
