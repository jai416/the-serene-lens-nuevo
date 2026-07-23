import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()
    const { id } = await params

    const client = await db.client.findUnique({ where: { id } })
    if (!client) return error("Cliente no encontrado", 404)
    if (client.estheticianId !== session.user.id) return forbidden()

    const { name, email, phone, notes } = await req.json()
    const data: any = {}
    if (name !== undefined) data.name = name
    if (email !== undefined) data.email = email
    if (phone !== undefined) data.phone = phone
    if (notes !== undefined) data.notes = notes

    const updated = await db.client.update({ where: { id }, data })
    return ok({ client: updated })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()
    const { id } = await params

    const client = await db.client.findUnique({ where: { id } })
    if (!client) return error("Cliente no encontrado", 404)
    if (client.estheticianId !== session.user.id) return forbidden()

    await db.client.delete({ where: { id } })
    return ok({ deleted: true })
  } catch (e) {
    return serverError(e)
  }
}
