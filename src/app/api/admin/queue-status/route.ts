import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { analysisQueue } from "@/lib/queue"
import { ok, unauthorized, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") return unauthorized()

    const stats = await analysisQueue.getStats()

    return ok({ stats })
  } catch (e) {
    logger.error("queue-status error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
