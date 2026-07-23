import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, serverError, unauthorized, error } from "@/lib/api-response"
import { validateCsrf } from "@/lib/csrf-middleware"
import { profileSchema } from "@/lib/validations"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    })

    return ok({ user })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!validateCsrf(req)) return error("CSRF token inválido", 403)
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const body = await req.json()
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        plan: true,
      },
    })

    return ok({ user })
  } catch (e) {
    return serverError(e)
  }
}
