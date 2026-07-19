import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, error, notFound, serverError } from "@/lib/api-response"

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { slug } = await params
    const group = await db.communityGroup.findUnique({ where: { slug } })
    if (!group) return notFound("Grupo no encontrado")

    await db.communityMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: session.user.id } },
      update: {},
      create: { groupId: group.id, userId: session.user.id },
    })

    return ok({ joined: true })
  } catch {
    return serverError()
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { slug } = await params
    const group = await db.communityGroup.findUnique({ where: { slug } })
    if (!group) return notFound("Grupo no encontrado")

    await db.communityMember.deleteMany({
      where: { groupId: group.id, userId: session.user.id },
    })

    return ok({ left: true })
  } catch {
    return serverError()
  }
}
