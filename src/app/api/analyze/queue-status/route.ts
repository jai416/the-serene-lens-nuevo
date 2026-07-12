import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ok, error, serverError } from "@/lib/api-response"
import { analysisQueue } from "@/lib/queue"
import { logger } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return error("No autorizado", 401)

    const jobId = req.nextUrl.searchParams.get("jobId")
    if (!jobId) return error("jobId requerido")

    const status = await analysisQueue.getStatus(jobId)
    if (status.status === "NOT_FOUND") return error("Job no encontrado", 404)

    return ok(status)
  } catch (e) {
    logger.error("queue-status error", { error: e instanceof Error ? e.message : String(e) })
    return serverError(e)
  }
}
