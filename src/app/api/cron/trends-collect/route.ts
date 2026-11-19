import { verifyCronSecret } from "@/lib/cron-auth"
import { ok, error, serverError } from "@/lib/api-response"
import { logger } from "@/lib/logger"
import { collectTrends } from "@/lib/trends/collector"

export const dynamic = "force-dynamic"

/**
 * Recolector de tendencias (M1 del AI Growth Engine).
 * Programado en cron-job.org con Bearer CRON_SECRET (ver docs/CRON-TRENDS.md).
 */
export async function POST(req: Request) {
  try {
    if (!verifyCronSecret(req)) {
      return error("Unauthorized", 401)
    }

    const result = await collectTrends(6)
    logger.info("Trends collection finished", { ...result })
    return ok(result)
  } catch (e) {
    logger.error("Trends collection failed", { error: e instanceof Error ? e.message : String(e) })
    return serverError()
  }
}

export async function GET() {
  return ok({ message: "Trends collector endpoint. Use POST with Bearer CRON_SECRET." })
}
