import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.role !== "ADMIN" && session.user.role !== "VALIDATOR") return forbidden()

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)))
    const skip = (page - 1) * limit

    const [transfers, total] = await Promise.all([
      db.transferPayment.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
          validator: { select: { name: true } },
          activator: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.transferPayment.count(),
    ])

    return ok({ transfers, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    return serverError(e)
  }
}
