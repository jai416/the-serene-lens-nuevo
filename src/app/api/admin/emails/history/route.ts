import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRecipientCounts } from "@/lib/services/admin-email.service"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        orderBy: { sentAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          subject: true,
          recipient: true,
          segment: true,
          status: true,
          sentAt: true,
        },
      }),
      db.emailLog.count(),
    ])

    const counts = await getRecipientCounts()

    return ok({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      recipientCounts: counts,
    })
  } catch {
    return serverError()
  }
}
