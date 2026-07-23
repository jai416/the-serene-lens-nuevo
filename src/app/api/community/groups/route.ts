import { NextRequest } from "next/server"
import { z } from "zod"
import { cache } from "react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

const createGroupSchema = z.object({
  name: z.string().min(1, "name es requerido").max(100),
  slug: z.string().min(1, "slug es requerido").max(50).regex(/^[a-z0-9-]+$/, "slug inválido"),
  description: z.string().min(1, "description es requerido").max(500),
  image: z.string().url().optional().or(z.literal("")),
})

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

    const body = await req.json()
    const parsed = createGroupSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.errors.map((e) => e.message).join(", "))
    }

    const { name, slug, description, image } = parsed.data

    const group = await db.communityGroup.create({
      data: {
        name,
        slug,
        description,
        image: image || null,
        createdById: session.user.id,
      },
    })

    // Auto-join the creator
    await db.communityMember.create({
      data: { groupId: group.id, userId: session.user.id },
    }).catch((e) => logger.error("Auto-join failed", { error: e }))

    return ok({ group }, 201)
  } catch {
    return serverError()
  }
}
