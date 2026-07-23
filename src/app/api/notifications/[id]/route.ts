import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, notFound, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(_req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { id } = await params

    const notification = await db.notification.findUnique({ where: { id } })
    if (!notification || notification.userId !== session.user.id) return notFound()

    await db.notification.update({
      where: { id },
      data: { read: true },
    })

    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!validateCsrf(_req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const { id } = await params

    const notification = await db.notification.findUnique({ where: { id } })
    if (!notification || notification.userId !== session.user.id) return notFound()

    await db.notification.delete({ where: { id } })

    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
