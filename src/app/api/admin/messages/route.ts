import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextRequest } from "next/server"
import { ok, unauthorized, serverError } from "@/lib/api-response"

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== "ADMIN") return null
  return session.user
}

export async function GET() {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
    })

    return ok({ messages })
  } catch (e) {
    return serverError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) return unauthorized()

    const { id, read } = await req.json()

    const message = await db.contactMessage.update({
      where: { id },
      data: { read },
    })

    return ok({ message })
  } catch (e) {
    return serverError(e)
  }
}
