import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, serverError, notFound } from "@/lib/api-response"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const group = await db.communityGroup.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, posts: true } },
        creator: { select: { name: true } },
        members: {
          include: { user: { select: { name: true } } },
          orderBy: { joinedAt: "asc" },
        },
      },
    })

    if (!group) return notFound()

    return ok({ group })
  } catch (e) {
    return serverError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("No autorizado", 401)

    const { id } = await params
    const group = await db.communityGroup.findUnique({ where: { id } })
    if (!group) return notFound()

    const existing = await db.communityMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    })

    if (existing) return error("Ya eres miembro de esta comunidad", 409)

    await db.communityMember.create({
      data: { groupId: id, userId: session.user.id, role: "MEMBER" },
    })

    return ok({ message: "Te has unido a la comunidad" })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return error("No autorizado", 401)

    const { id } = await params
    const member = await db.communityMember.findUnique({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    })

    if (!member) return error("No eres miembro de esta comunidad", 404)
    if (member.role === "OWNER") return error("El creador no puede salirse de la comunidad", 400)

    await db.communityMember.delete({
      where: { groupId_userId: { groupId: id, userId: session.user.id } },
    })

    return ok({ message: "Has salido de la comunidad" })
  } catch (e) {
    return serverError(e)
  }
}
