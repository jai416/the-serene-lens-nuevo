import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = 20
    const skip = (page - 1) * limit
    const status = searchParams.get("status")
    const where = status && ["open", "in_progress", "resolved", "closed"].includes(status) ? { status } : {}
    const [tickets, total] = await db.$transaction([
      db.supportTicket.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } }, _count: { select: { responses: true } } },
        orderBy: { createdAt: "desc" },
        skip, take: limit,
      }),
      db.supportTicket.count({ where }),
    ])
    return ok({ tickets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } })
  } catch (e) { return serverError(e) }
}
