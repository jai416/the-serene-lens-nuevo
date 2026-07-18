import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, forbidden, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    if (session.user.plan !== "ESTHETICIAN") return forbidden()

    const clinic = await db.clinic.findUnique({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { referredUsers: true } },
        referredUsers: {
          select: { id: true, name: true, email: true, createdAt: true, plan: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    return ok({
      total: clinic?._count.referredUsers || 0,
      users: clinic?.referredUsers || [],
    })
  } catch (e) {
    return serverError(e)
  }
}
