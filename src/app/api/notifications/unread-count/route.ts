import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUnreadCount } from "@/lib/notifications"
import { ok, unauthorized } from "@/lib/api-response"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return unauthorized()
  const count = await getUnreadCount(session.user.id)
  return ok({ count })
}
