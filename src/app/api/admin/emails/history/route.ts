import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const notifications = await db.notification.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, title: true, message: true, createdAt: true },
    })

    const seen = new Set<string>()
    const unique = notifications.filter((n) => {
      const key = `${n.title}-${n.createdAt.toISOString().slice(0, 16)}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return ok({ notifications: unique, pagination: { page, limit, total: unique.length } })
  } catch {
    return serverError()
  }
}
