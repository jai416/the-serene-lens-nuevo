import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError } from "@/lib/api-response"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "grupo"
}

export async function GET() {
  try {
    const groups = await db.communityGroup.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { members: true, posts: true } },
        creator: { select: { name: true } },
      },
    })

    return ok({ groups })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("No autorizado", 401)

    const body = await req.json()
    const { name, description, image } = body

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return error("El nombre debe tener al menos 2 caracteres", 400)
    }

    const slug = slugify(name)
    const existing = await db.communityGroup.findUnique({ where: { slug } })
    const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug

    const group = await db.communityGroup.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() || "",
        image: image || null,
        createdById: session.user.id,
      },
    })

    await db.communityMember.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "OWNER",
      },
    })

    return ok(group, 201)
  } catch (e) {
    return serverError(e)
  }
}
