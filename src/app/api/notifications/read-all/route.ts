import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"

export async function POST(_req: NextRequest) {
  try {
    if (!validateCsrf(_req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })

    return ok({ success: true })
  } catch (e) {
    return serverError(e)
  }
}
