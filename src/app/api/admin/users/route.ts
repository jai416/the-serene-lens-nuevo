import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import { ok, unauthorized, serverError, error } from "@/lib/api-response"
import { adminUserUpdateSchema } from "@/lib/validations"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const { searchParams } = new URL(req.url)
    const telegramLinked = searchParams.get("telegramLinked") === "true"

    const where = telegramLinked ? { telegramId: { not: null } } : {}

    const users = await db.user.findMany({
      where,
      orderBy: telegramLinked ? { telegramId: "asc" } : { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        telegramId: true,
        createdAt: true,
        _count: { select: { analyses: true, payments: true } },
      },
    })

    return ok({ users })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const body = await req.json()
    const parsed = adminUserUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return error(parsed.error.issues.map((i) => i.message).join(", "), 400)
    }

    const { id, role, plan, telegramId } = parsed.data

    const user = await db.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(plan !== undefined && { plan }),
        ...(telegramId !== undefined && { telegramId }),
      },
      select: { id: true, name: true, email: true, role: true, plan: true, telegramId: true },
    })

    return ok({ user })
  } catch (e) {
    return serverError(e)
  }
}
