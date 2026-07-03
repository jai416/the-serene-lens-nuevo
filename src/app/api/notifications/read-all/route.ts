import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function POST(_req: NextRequest) {
  try {
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
