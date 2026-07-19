import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { BadgeService } from "@/lib/services/badge.service"
import { ok, unauthorized, serverError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return unauthorized()
    }
    const badges = await BadgeService.getUserBadges(session.user.id)
    return ok({ badges })
  } catch {
    return serverError()
  }
}
