import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, unauthorized, serverError } from "@/lib/api-response"
import { getUsageInfo } from "@/lib/usage"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return unauthorized()

    const usage = await getUsageInfo(session.user.id)

    return ok({ usage })
  } catch (e) {
    return serverError(e)
  }
}
