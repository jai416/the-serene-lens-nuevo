import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, error, unauthorized, forbidden, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return unauthorized()
    if (session.user.role !== "ADMIN") return forbidden()

    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")))
    const action = url.searchParams.get("action") || ""
    const search = url.searchParams.get("search") || ""

    const where: Record<string, unknown> = {}

    if (action) {
      where.action = action
    }

    if (search) {
      where.OR = [
        { details: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { ip: { contains: search, mode: "insensitive" } },
      ]
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return ok({
      logs: logs.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      })),
      total,
      totalPages: Math.ceil(total / limit),
      page,
    })
  } catch (e) {
    logger.error("Admin logs error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
