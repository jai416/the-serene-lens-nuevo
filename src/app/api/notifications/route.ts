import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserNotifications, markAllRead, markNotificationRead } from "@/lib/notifications"
import { ok, unauthorized, error, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const notifications = await getUserNotifications(session.user.id)
    return ok({ notifications })
  } catch { return serverError() }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()
    const { id } = await req.json()
    if (id) {
      await markNotificationRead(id, session.user.id)
    } else {
      await markAllRead(session.user.id)
    }
    return ok({ success: true })
  } catch { return serverError() }
}
