import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, serverError } from "@/lib/api-response"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return error("Cuerpo de request inválido")

  const challenge = await db.challenge.findUnique({ where: { id } })
  if (!challenge) return error("Desafío no encontrado", 404)

  const updated = await db.challenge.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.points !== undefined && { points: body.points }),
      ...(body.frequency !== undefined && { frequency: body.frequency }),
      ...(body.active !== undefined && { active: body.active }),
    },
  })

  return ok(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

  const { id } = await params
  const challenge = await db.challenge.findUnique({ where: { id } })
  if (!challenge) return error("Desafío no encontrado", 404)

  await db.challenge.delete({ where: { id } })
  return ok({ deleted: true })
}
